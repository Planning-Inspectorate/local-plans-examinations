import { DefaultAzureCredential } from '@azure/identity';
import { BlobServiceClient } from '@azure/storage-blob';
import type { BlockBlobUploadOptions } from '@azure/storage-blob';
import { randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';
import { sanitiseFileName } from './file-name.ts';
import type { FileUploadDestination, FileUploadStorageAdapter, UploadedFile, UploadedRequestFile } from './types.ts';

export type BlobFileStorageConfig = {
	containerName: string;
	accountUrl?: string;
	connectionString?: string;
	basePath?: string;
	createContainerIfNotExists?: boolean;
};

export class BlobFileStorageAdapter implements FileUploadStorageAdapter {
	readonly provider = 'blob';

	private readonly client: BlobServiceClient;
	private readonly config: BlobFileStorageConfig;

	/**
	 * Creates an Azure Blob Storage backed file upload adapter.
	 *
	 * If a `BlobServiceClient` is not supplied, one is created from the config using either
	 * a connection string or an account URL with `DefaultAzureCredential`.
	 *
	 * @param config - Azure Blob Storage container and authentication settings.
	 * @param client - Optional preconfigured Blob service client, usually supplied by tests.
	 */
	constructor(config: BlobFileStorageConfig, client?: BlobServiceClient) {
		this.config = config;
		this.client = client ?? createBlobServiceClient(config);
	}

	/**
	 * Uploads a request file to Azure Blob Storage and returns the stored file details.
	 *
	 * The upload path is built from the configured base path, the destination folder path,
	 * and a UUID-prefixed sanitised filename. The container is created automatically unless
	 * `createContainerIfNotExists` is set to `false`.
	 *
	 * @param file - File data from the upload request. Supports either a buffer or stream.
	 * @param destination - Optional folder, filename override, and metadata for this upload.
	 * @returns Details of the uploaded blob, including its blob path and public service URL.
	 */
	async upload(file: UploadedRequestFile, destination: FileUploadDestination = {}): Promise<UploadedFile> {
		const container = this.client.getContainerClient(this.config.containerName);
		if (this.config.createContainerIfNotExists !== false) {
			await container.createIfNotExists();
		}

		const fileName = sanitiseFileName(destination.fileName ?? file.originalname);
		const blobName = buildBlobPath(this.config.basePath, destination.folderPath, `${randomUUID()}-${fileName}`);
		const blockBlob = container.getBlockBlobClient(blobName);
		const options: BlockBlobUploadOptions = {
			blobHTTPHeaders: { blobContentType: file.mimetype },
			metadata: normaliseMetadata(destination.metadata)
		};

		if (file.buffer) {
			await blockBlob.uploadData(file.buffer, options);
		} else if (file.stream) {
			await blockBlob.uploadStream(file.stream, undefined, undefined, options);
		} else {
			await blockBlob.uploadStream(Readable.from([]), undefined, undefined, options);
		}

		return {
			id: blobName,
			fileName,
			mimeType: file.mimetype,
			size: file.size,
			storageProvider: this.provider,
			path: blobName,
			url: blockBlob.url,
			metadata: destination.metadata
		};
	}

	/**
	 * Deletes a previously uploaded file from Azure Blob Storage if it still exists.
	 *
	 * The blob name is taken from `file.path` when available, falling back to `file.id`.
	 * Missing blobs are ignored by Azure because this uses `deleteIfExists`.
	 *
	 * @param file - Stored file details returned from `upload` or `list`.
	 */
	async delete(file: UploadedFile): Promise<void> {
		const container = this.client.getContainerClient(this.config.containerName);
		const blockBlob = container.getBlockBlobClient(file.path ?? file.id);
		await blockBlob.deleteIfExists();
	}

	/**
	 * Lists blobs in the configured container, optionally scoped to a destination folder.
	 *
	 * The list prefix is built from the configured base path and destination folder path.
	 * Each Azure blob item is converted into the shared `UploadedFile` shape used by the
	 * rest of the upload component.
	 *
	 * @param destination - Optional folder path to restrict the returned blobs.
	 * @returns Stored file details for every matching blob.
	 */
	async list(destination: FileUploadDestination = {}): Promise<UploadedFile[]> {
		const container = this.client.getContainerClient(this.config.containerName);
		const prefix = buildBlobPath(this.config.basePath, destination.folderPath);
		const blobs: UploadedFile[] = [];
		for await (const blob of container.listBlobsFlat(prefix ? { prefix } : undefined)) {
			blobs.push({
				id: blob.name,
				fileName: blob.name.split('/').pop() ?? blob.name,
				mimeType: blob.properties.contentType ?? 'application/octet-stream',
				size: blob.properties.contentLength ?? 0,
				storageProvider: this.provider,
				path: blob.name
			});
		}
		return blobs;
	}
}

/**
 * Creates the Azure Blob service client used by the storage adapter.
 *
 * A connection string is preferred when supplied, which is useful for local Azurite
 * development. Otherwise the account URL is combined with `DefaultAzureCredential` for
 * managed identity or developer credentials in Azure environments.
 *
 * @param config - Blob storage authentication and account settings.
 * @returns A configured `BlobServiceClient`.
 * @throws If neither `connectionString` nor `accountUrl` is provided.
 */
function createBlobServiceClient(config: BlobFileStorageConfig): BlobServiceClient {
	if (config.connectionString) {
		return BlobServiceClient.fromConnectionString(config.connectionString);
	}

	if (!config.accountUrl) {
		throw new Error('Blob storage requires either connectionString or accountUrl');
	}

	return new BlobServiceClient(config.accountUrl, new DefaultAzureCredential());
}

/**
 * Builds a clean blob path from optional path segments.
 *
 * Empty values are skipped, leading and trailing slashes are removed from each segment,
 * and the remaining parts are joined with `/` so Azure receives a stable blob name.
 *
 * @param parts - Optional path segments such as base path, folder path, and filename.
 * @returns A normalised Azure blob path.
 */
function buildBlobPath(...parts: Array<string | undefined>): string {
	return parts
		.filter(Boolean)
		.map((part) => String(part).replace(/^\/+|\/+$/g, ''))
		.filter(Boolean)
		.join('/');
}

/**
 * Converts arbitrary metadata values into Azure Blob Storage metadata strings.
 *
 * Azure metadata values must be strings, while upload destinations can pass simple
 * application values. This keeps the metadata keys unchanged and stringifies each value.
 *
 * @param metadata - Optional metadata supplied for the uploaded file.
 * @returns String-only metadata for Azure, or `undefined` when no metadata was supplied.
 */
function normaliseMetadata(metadata?: Record<string, unknown>): Record<string, string> | undefined {
	if (!metadata) {
		return undefined;
	}

	return Object.fromEntries(Object.entries(metadata).map(([key, value]) => [key, String(value)]));
}
