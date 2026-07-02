import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { SharePointFileStorageAdapter } from './sharepoint-storage.ts';
import type { GraphClientLike } from './sharepoint-storage.ts';

describe('SharePointFileStorageAdapter', () => {
	it('uploads buffered files to an encoded SharePoint drive path', async () => {
		const graph = createFakeGraphClient({
			id: 'item-1',
			webUrl: 'https://sharepoint.example/file',
			size: 456,
			name: 'stored-cover-letter.pdf'
		});
		const adapter = new SharePointFileStorageAdapter({
			graphClient: graph.client,
			driveId: 'drive-1',
			basePath: '/cases/'
		});
		const buffer = Buffer.from('file contents');

		const uploaded = await adapter.upload(
			{
				originalname: 'cover?letter.pdf',
				mimetype: 'application/pdf',
				size: buffer.length,
				buffer
			},
			{
				folderPath: '/gateway 2/reports & letters/',
				metadata: { caseId: 123 }
			}
		);

		assert.equal(graph.headers[0].name, 'Content-Type');
		assert.equal(graph.headers[0].value, 'application/pdf');
		assert.equal(graph.putBodies[0], buffer);
		assert.match(
			graph.apiPaths[0],
			/^\/drives\/drive-1\/root:\/cases\/gateway%202\/reports%20%26%20letters\/[0-9a-f-]{36}-cover_letter\.pdf:\/content$/
		);
		assert.match(uploaded.path ?? '', /^cases\/gateway 2\/reports & letters\/[0-9a-f-]{36}-cover_letter\.pdf$/);
		assert.deepEqual(uploaded, {
			id: 'item-1',
			fileName: 'stored-cover-letter.pdf',
			mimeType: 'application/pdf',
			size: 456,
			storageProvider: 'sharepoint',
			path: uploaded.path,
			url: 'https://sharepoint.example/file',
			metadata: { caseId: 123 }
		});
	});

	it('requires file buffers because the Graph upload path does not stream', async () => {
		const graph = createFakeGraphClient({});
		const adapter = new SharePointFileStorageAdapter({
			graphClient: graph.client,
			driveId: 'drive-1'
		});

		await assert.rejects(
			() =>
				adapter.upload({
					originalname: 'cover-letter.pdf',
					mimetype: 'application/pdf',
					size: 123
				}),
			/SharePoint upload adapter currently expects multer memory storage and file.buffer/
		);
	});

	it('deletes files by SharePoint drive item id', async () => {
		const graph = createFakeGraphClient({});
		const adapter = new SharePointFileStorageAdapter({
			graphClient: graph.client,
			driveId: 'drive-1'
		});

		await adapter.delete({
			id: 'item-1',
			fileName: 'cover-letter.pdf',
			mimeType: 'application/pdf',
			size: 123,
			storageProvider: 'sharepoint'
		});

		assert.deepEqual(graph.apiPaths, ['/drives/drive-1/items/item-1']);
		assert.equal(graph.deleteCalls, 1);
	});
});

function createFakeGraphClient(uploadResult: unknown) {
	const fake = {
		apiPaths: [] as string[],
		headers: [] as Array<{ name: string; value: string }>,
		putBodies: [] as Buffer[],
		deleteCalls: 0
	};

	const client: GraphClientLike = {
		api(path: string) {
			fake.apiPaths.push(path);
			return {
				header(name: string, value: string) {
					fake.headers.push({ name, value });
					return {
						async put(body: Buffer) {
							fake.putBodies.push(body);
							return uploadResult;
						}
					};
				},
				async put(body: Buffer) {
					fake.putBodies.push(body);
					return uploadResult;
				},
				async delete() {
					fake.deleteCalls += 1;
				}
			};
		}
	};

	return Object.assign(fake, { client });
}
