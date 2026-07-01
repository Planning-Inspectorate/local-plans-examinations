import type { BlobServiceClient } from '@azure/storage-blob';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { describe, it } from 'node:test';
import { BlobFileStorageAdapter } from './blob-storage.ts';
import type { UploadedFile } from './types.ts';

describe('BlobFileStorageAdapter', () => {
	it('uploads buffered files to a sanitised UUID-prefixed blob path', async () => {
		const fakeAzure = createFakeBlobServiceClient();
		const adapter = new BlobFileStorageAdapter(
			{ containerName: 'documents', basePath: '/cases/', createContainerIfNotExists: true },
			fakeAzure.client
		);
		const buffer = Buffer.from('file contents');

		const uploaded = await adapter.upload(
			{
				originalname: 'cover?letter.pdf',
				mimetype: 'application/pdf',
				size: buffer.length,
				buffer
			},
			{
				folderPath: '/gateway-2/',
				metadata: { caseId: 123, checked: true }
			}
		);

		assert.equal(fakeAzure.containerName, 'documents');
		assert.equal(fakeAzure.createIfNotExistsCalls, 1);
		assert.match(fakeAzure.blobName, /^cases\/gateway-2\/[0-9a-f-]{36}-cover_letter\.pdf$/);
		assert.equal(fakeAzure.uploadDataCalls.length, 1);
		assert.equal(fakeAzure.uploadDataCalls[0].body, buffer);
		assert.deepEqual(fakeAzure.uploadDataCalls[0].options, {
			blobHTTPHeaders: { blobContentType: 'application/pdf' },
			metadata: { caseId: '123', checked: 'true' }
		});
		assert.deepEqual(uploaded, {
			id: fakeAzure.blobName,
			fileName: 'cover_letter.pdf',
			mimeType: 'application/pdf',
			size: buffer.length,
			storageProvider: 'blob',
			path: fakeAzure.blobName,
			url: `https://storage.example/${fakeAzure.blobName}`,
			metadata: { caseId: 123, checked: true }
		});
	});

	it('uploads streams without creating the container when container creation is disabled', async () => {
		const fakeAzure = createFakeBlobServiceClient();
		const adapter = new BlobFileStorageAdapter(
			{ containerName: 'documents', createContainerIfNotExists: false },
			fakeAzure.client
		);
		const stream = Readable.from(['streamed contents']);

		await adapter.upload({
			originalname: 'cover-letter.pdf',
			mimetype: 'application/pdf',
			size: 16,
			stream
		});

		assert.equal(fakeAzure.createIfNotExistsCalls, 0);
		assert.equal(fakeAzure.uploadStreamCalls.length, 1);
		assert.equal(fakeAzure.uploadStreamCalls[0].stream, stream);
		assert.deepEqual(fakeAzure.uploadStreamCalls[0].options, {
			blobHTTPHeaders: { blobContentType: 'application/pdf' },
			metadata: undefined
		});
	});

	it('deletes a blob using the stored path when one is available', async () => {
		const fakeAzure = createFakeBlobServiceClient();
		const adapter = new BlobFileStorageAdapter({ containerName: 'documents' }, fakeAzure.client);

		await adapter.delete({
			id: 'id-only.pdf',
			fileName: 'cover-letter.pdf',
			mimeType: 'application/pdf',
			size: 10,
			storageProvider: 'blob',
			path: 'cases/gateway-2/cover-letter.pdf'
		});

		assert.equal(fakeAzure.blobName, 'cases/gateway-2/cover-letter.pdf');
		assert.equal(fakeAzure.deleteIfExistsCalls, 1);
	});

	it('lists blobs under the configured base path and destination folder', async () => {
		const fakeAzure = createFakeBlobServiceClient([
			{
				name: 'cases/gateway-2/cover-letter.pdf',
				properties: { contentType: 'application/pdf', contentLength: 123 }
			},
			{
				name: 'cases/gateway-2/readme',
				properties: {}
			}
		]);
		const adapter = new BlobFileStorageAdapter({ containerName: 'documents', basePath: '/cases/' }, fakeAzure.client);

		const files = await adapter.list({ folderPath: '/gateway-2/' });

		assert.deepEqual(fakeAzure.listBlobsFlatOptions, [{ prefix: 'cases/gateway-2' }]);
		assert.deepEqual(files, [
			{
				id: 'cases/gateway-2/cover-letter.pdf',
				fileName: 'cover-letter.pdf',
				mimeType: 'application/pdf',
				size: 123,
				storageProvider: 'blob',
				path: 'cases/gateway-2/cover-letter.pdf'
			},
			{
				id: 'cases/gateway-2/readme',
				fileName: 'readme',
				mimeType: 'application/octet-stream',
				size: 0,
				storageProvider: 'blob',
				path: 'cases/gateway-2/readme'
			}
		]);
	});

	it('requires either a connection string or account URL when no client is supplied', () => {
		assert.throws(
			() => new BlobFileStorageAdapter({ containerName: 'documents' }),
			/Blob storage requires either connectionString or accountUrl/
		);
	});
});

type FakeBlobItem = {
	name: string;
	properties: {
		contentType?: string;
		contentLength?: number;
	};
};

function createFakeBlobServiceClient(blobItems: FakeBlobItem[] = []) {
	const fake = {
		containerName: '',
		blobName: '',
		createIfNotExistsCalls: 0,
		deleteIfExistsCalls: 0,
		uploadDataCalls: [] as Array<{ body: Buffer; options: unknown }>,
		uploadStreamCalls: [] as Array<{ stream: Readable; options: unknown }>,
		listBlobsFlatOptions: [] as unknown[]
	};

	const blockBlob = {
		get url() {
			return `https://storage.example/${fake.blobName}`;
		},
		async uploadData(body: Buffer, options: unknown) {
			fake.uploadDataCalls.push({ body, options });
		},
		async uploadStream(stream: Readable, _bufferSize?: number, _maxConcurrency?: number, options?: unknown) {
			fake.uploadStreamCalls.push({ stream, options });
		},
		async deleteIfExists() {
			fake.deleteIfExistsCalls += 1;
		}
	};

	const container = {
		async createIfNotExists() {
			fake.createIfNotExistsCalls += 1;
		},
		getBlockBlobClient(blobName: string) {
			fake.blobName = blobName;
			return blockBlob;
		},
		listBlobsFlat(options?: unknown) {
			fake.listBlobsFlatOptions.push(options);
			return {
				async *[Symbol.asyncIterator]() {
					for (const blob of blobItems) {
						yield blob;
					}
				}
			};
		}
	};

	const client = {
		getContainerClient(containerName: string) {
			fake.containerName = containerName;
			return container;
		}
	} as unknown as BlobServiceClient;

	return Object.assign(fake, { client });
}
