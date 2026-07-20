import assert from 'node:assert/strict';
import type { Request } from 'express';
import { describe, it, mock } from 'node:test';
import type { PortalService } from '#service';
import type { UploadedFile } from '@pins/local-plans-lib/forms/custom-components/file-uploader/index.ts';
import {
	GATEWAY_2_COVER_LETTER_DOCUMENT_SET_ID,
	loadGateway2CoverLetterDocuments,
	saveGateway2CoverLetterDocuments
} from './documents.ts';

describe('loadGateway2CoverLetterDocuments', () => {
	it('loads documents as uploaded files', async () => {
		const service = createMockService({
			existingDocuments: [
				{
					guid: 'document-1',
					name: 'stored-file',
					documentSetId: GATEWAY_2_COVER_LETTER_DOCUMENT_SET_ID,
					isDeleted: false,
					latestDocumentVersion: {
						version: 1,
						originalFilename: 'cover-letter.pdf',
						fileName: 'stored-cover-letter.pdf',
						mime: 'application/pdf',
						size: 123,
						blobStorageContainer: 'local-planning-documents',
						blobStoragePath: 'gateway-2/cover-letter.pdf',
						documentURI: 'http://storage/cover-letter.pdf',
						isDeleted: false
					}
				}
			]
		});

		const files = await loadGateway2CoverLetterDocuments(service as unknown as PortalService, 'case-1');

		assert.deepEqual(files, [
			{
				id: 'gateway-2/cover-letter.pdf',
				fileName: 'cover-letter.pdf',
				mimeType: 'application/pdf',
				size: 123,
				storageProvider: 'blob',
				containerName: 'local-planning-documents',
				path: 'gateway-2/cover-letter.pdf',
				url: 'http://storage/cover-letter.pdf',
				metadata: {
					documentGuid: 'document-1',
					documentSetId: GATEWAY_2_COVER_LETTER_DOCUMENT_SET_ID,
					version: 1
				}
			}
		]);
		assert.deepEqual(service.db.document.findMany.mock.calls[0].arguments[0], {
			where: {
				caseId: 'case-1',
				documentSetId: GATEWAY_2_COVER_LETTER_DOCUMENT_SET_ID,
				isDeleted: false
			},
			include: {
				latestDocumentVersion: true
			},
			orderBy: {
				createdAt: 'asc'
			}
		});
	});
});

describe('saveGateway2CoverLetterDocuments', () => {
	it('creates a document and version for a new uploaded file', async () => {
		const tx = createTransactionClient();
		const service = createMockService({ tx });
		const uploadedFile = buildUploadedFile();

		await saveGateway2CoverLetterDocuments(service as unknown as PortalService, buildRequest(), [uploadedFile]);

		assert.equal(service.db.documentSet.findUnique.mock.callCount(), 1);
		assert.equal(tx.document.create.mock.callCount(), 1);
		assert.equal(tx.documentVersion.create.mock.callCount(), 1);
		assert.equal(tx.document.update.mock.callCount(), 1);

		const documentCreateData = tx.document.create.mock.calls[0].arguments[0].data;
		assert.equal(documentCreateData.name, uploadedFile.id);
		assert.equal(documentCreateData.caseId, 'case-1');
		assert.equal(documentCreateData.documentSetId, GATEWAY_2_COVER_LETTER_DOCUMENT_SET_ID);

		assert.deepEqual(tx.documentVersion.create.mock.calls[0].arguments[0].data, {
			documentGuid: documentCreateData.guid,
			version: 1,
			originalFilename: 'cover-letter.pdf',
			fileName: 'cover-letter.pdf',
			mime: 'application/pdf',
			size: 100,
			blobStorageContainer: 'local-planning-documents',
			blobStoragePath: 'gateway-2/cover-letter.pdf',
			documentURI: 'http://storage/cover-letter.pdf',
			sourceSystem: 'front-office',
			virusCheckStatus: 'not_scanned'
		});
		assert.deepEqual(tx.document.update.mock.calls[0].arguments[0], {
			where: {
				guid: documentCreateData.guid
			},
			data: {
				latestVersionId: 1
			}
		});
	});

	it('soft-deletes existing documents when the upload list is empty', async () => {
		const tx = createTransactionClient();
		const service = createMockService({
			tx,
			existingDocuments: [buildDocumentRow({ guid: 'document-1' })]
		});

		await saveGateway2CoverLetterDocuments(service as unknown as PortalService, buildRequest(), []);

		assert.deepEqual(tx.document.update.mock.calls[0].arguments[0], {
			where: {
				guid: 'document-1'
			},
			data: {
				isDeleted: true
			}
		});
		assert.deepEqual(tx.documentVersion.updateMany.mock.calls[0].arguments[0], {
			where: {
				documentGuid: 'document-1'
			},
			data: {
				isDeleted: true
			}
		});
	});

	it('rejects more than one active uploaded document', async () => {
		const service = createMockService();

		await assert.rejects(
			() =>
				saveGateway2CoverLetterDocuments(service as unknown as PortalService, buildRequest(), [
					buildUploadedFile({ id: 'file-1' }),
					buildUploadedFile({ id: 'file-2' })
				]),
			/Gateway 2 cover letter can only have one active uploaded document/
		);
		assert.equal(service.db.$transaction.mock.callCount(), 0);
	});

	it('rejects save when the document set reference data is missing', async () => {
		const service = createMockService({ documentSet: null });

		await assert.rejects(
			() =>
				saveGateway2CoverLetterDocuments(service as unknown as PortalService, buildRequest(), [buildUploadedFile()]),
			/Missing document set reference data for "g2-cover-letter"/
		);
		assert.equal(service.db.$transaction.mock.callCount(), 0);
	});

	it('requires a loaded case on the request', async () => {
		const service = createMockService();

		await assert.rejects(
			() => saveGateway2CoverLetterDocuments(service as unknown as PortalService, {} as Request, [buildUploadedFile()]),
			/Cannot save Gateway 2 cover letter documents without a loaded case/
		);
		assert.equal(service.db.documentSet.findUnique.mock.callCount(), 0);
	});
});

function createMockService({
	documentSet = { id: GATEWAY_2_COVER_LETTER_DOCUMENT_SET_ID },
	existingDocuments = [],
	tx = createTransactionClient()
}: {
	documentSet?: { id: string } | null;
	existingDocuments?: unknown[];
	tx?: ReturnType<typeof createTransactionClient>;
} = {}) {
	return {
		db: {
			documentSet: {
				findUnique: mock.fn(async () => documentSet)
			},
			document: {
				findMany: mock.fn(async () => existingDocuments)
			},
			$transaction: mock.fn(async (callback: (tx: typeof tx) => unknown) => callback(tx))
		}
	};
}

function createTransactionClient() {
	return {
		document: {
			create: mock.fn(async () => ({})),
			update: mock.fn(async () => ({}))
		},
		documentVersion: {
			create: mock.fn(async () => ({})),
			update: mock.fn(async () => ({})),
			updateMany: mock.fn(async () => ({}))
		}
	};
}

function buildRequest(): Request {
	return {
		currentCase: {
			id: 'case-1'
		}
	} as unknown as Request;
}

function buildUploadedFile(overrides: Partial<UploadedFile> = {}): UploadedFile {
	return {
		id: 'gateway-2/cover-letter.pdf',
		fileName: 'cover-letter.pdf',
		mimeType: 'application/pdf',
		size: 100,
		storageProvider: 'blob',
		containerName: 'local-planning-documents',
		path: 'gateway-2/cover-letter.pdf',
		url: 'http://storage/cover-letter.pdf',
		...overrides
	};
}

function buildDocumentRow(overrides: Record<string, unknown> = {}) {
	return {
		guid: 'document-1',
		name: 'gateway-2/cover-letter.pdf',
		documentSetId: GATEWAY_2_COVER_LETTER_DOCUMENT_SET_ID,
		isDeleted: false,
		latestDocumentVersion: {
			version: 1,
			originalFilename: 'cover-letter.pdf',
			fileName: 'cover-letter.pdf',
			mime: 'application/pdf',
			size: 100,
			blobStorageContainer: 'local-planning-documents',
			blobStoragePath: 'gateway-2/cover-letter.pdf',
			documentURI: 'http://storage/cover-letter.pdf',
			isDeleted: false
		},
		...overrides
	};
}
