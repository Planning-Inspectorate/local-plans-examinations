import assert from 'node:assert/strict';
import type { Request, Response } from 'express';
import { describe, it, mock } from 'node:test';
import type { PortalService } from '#service';
import { downloadGateway3Document } from './download.ts';

describe('downloadGateway3Document', () => {
	it('downloads a document by documentId', async () => {
		const downloadToExpressResponse = mock.fn(async () => {});
		const service = {
			db: {
				document: {
					findFirst: mock.fn(async () => ({
						latestDocumentVersion: {
							blobStorageContainer: 'container',
							blobStoragePath: 'path/to/file.pdf',
							fileName: 'file.pdf'
						}
					}))
				}
			},
			createFileStorage: mock.fn(() => ({
				downloadToExpressResponse
			}))
		} as unknown as PortalService;

		const handler = downloadGateway3Document(service);

		const req = {
			params: { documentId: 'doc-123' }
		} as unknown as Request;
		const res = {} as unknown as Response;

		await handler(req, res, () => {});

		assert.equal(downloadToExpressResponse.mock.callCount(), 1);
	});

	it('throws when documentId is missing', async () => {
		const service = {} as unknown as PortalService;
		const handler = downloadGateway3Document(service);

		const req = {
			params: {}
		} as unknown as Request;
		const res = {} as unknown as Response;

		await assert.rejects(async () => handler(req, res, () => {}), /Missing documentId for download/);
	});
});
