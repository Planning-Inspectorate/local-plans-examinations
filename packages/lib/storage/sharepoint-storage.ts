import { randomUUID } from 'node:crypto';
import { sanitiseFileName } from './file-name.ts';
import type { FileUploadDestination, FileUploadStorageAdapter, UploadedFile, UploadedRequestFile } from './types.ts';

export type GraphClientLike = {
	api(path: string): {
		header(name: string, value: string): { put(body: Buffer): Promise<unknown> };
		put?(body: Buffer): Promise<unknown>;
		delete?(): Promise<unknown>;
	};
};

export type SharePointFileStorageConfig = {
	graphClient: GraphClientLike;
	driveId: string;
	basePath?: string;
};

export class SharePointFileStorageAdapter implements FileUploadStorageAdapter {
	readonly provider = 'sharepoint';

	private readonly config: SharePointFileStorageConfig;

	constructor(config: SharePointFileStorageConfig) {
		this.config = config;
	}

	async upload(file: UploadedRequestFile, destination: FileUploadDestination = {}): Promise<UploadedFile> {
		if (!file.buffer) {
			throw new Error('SharePoint upload adapter currently expects multer memory storage and file.buffer');
		}

		const fileName = sanitiseFileName(destination.fileName ?? file.originalname);
		const path = buildSharePointPath(this.config.basePath, destination.folderPath, `${randomUUID()}-${fileName}`);
		const apiPath = `/drives/${this.config.driveId}/root:/${encodeSharePointPath(path)}:/content`;
		const result = await this.config.graphClient.api(apiPath).header('Content-Type', file.mimetype).put(file.buffer);
		const item = result as { id?: string; webUrl?: string; size?: number; name?: string };

		return {
			id: item.id ?? path,
			fileName: item.name ?? fileName,
			mimeType: file.mimetype,
			size: item.size ?? file.size,
			storageProvider: this.provider,
			path,
			url: item.webUrl,
			metadata: destination.metadata
		};
	}

	async delete(file: UploadedFile): Promise<void> {
		await this.config.graphClient.api(`/drives/${this.config.driveId}/items/${file.id}`).delete?.();
	}
}

function buildSharePointPath(...parts: Array<string | undefined>): string {
	return parts
		.filter(Boolean)
		.map((part) => String(part).replace(/^\/+|\/+$/g, ''))
		.filter(Boolean)
		.join('/');
}

function encodeSharePointPath(path: string): string {
	return path
		.split('/')
		.map((segment) => encodeURIComponent(segment))
		.join('/');
}
