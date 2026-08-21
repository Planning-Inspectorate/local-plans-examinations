import assert from 'node:assert/strict';
import type { Request } from 'express';
import { describe, it, mock } from 'node:test';
import type { ManageService } from '#service';
import {
	DOCUMENT_SET_FOLDER_NAME,
	DOCUMENT_SET_ID
} from '@pins/local-plans-database/src/seed/static-data/ids/index.ts';
import type { UploadedFile } from '@pins/local-plans-lib/forms/custom-components/file-uploader/index.ts';
import {
	getDocumentSetIdsByFolderName,
	getLatestDocumentBlobDetails,
	loadUploadedDocuments,
	saveDocuments
} from './documents.ts';

const COVER_LETTER_DOCUMENT_SET_ID = DOCUMENT_SET_ID.G2_COVER_LETTER;
const TEST_DOCUMENT_SET_FOLDER_NAME = DOCUMENT_SET_FOLDER_NAME.G2_COVER_LETTER;

describe('loadUploadedDocuments', () => {
	it('loads documents as uploaded files', async () => {
		const service = createMockService({
			existingDocuments: [
				{
					guid: 'document-1',
					name: 'stored-file',
					documentSetId: COVER_LETTER_DOCUMENT_SET_ID,
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

		const files = await loadUploadedDocuments(
			service as unknown as ManageService,
			'case-1',
			COVER_LETTER_DOCUMENT_SET_ID
		);

		assert.deepEqual(files, [
			{
				id: 'document-1',
				fileName: 'cover-letter.pdf',
				mimeType: 'application/pdf',
				size: 123,
				storageProvider: 'blob',
				containerName: 'local-planning-documents',
				path: 'gateway-2/cover-letter.pdf',
				url: 'http://storage/cover-letter.pdf',
				metadata: {
					documentGuid: 'document-1',
					documentSetId: COVER_LETTER_DOCUMENT_SET_ID,
					version: 1
				}
			}
		]);
		assert.deepEqual(service.db.document.findMany.mock.calls[0].arguments[0], {
			where: {
				caseId: 'case-1',
				documentSetId: COVER_LETTER_DOCUMENT_SET_ID,
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

describe('getDocumentSetIdsByFolderName', () => {
	it('loads document set IDs for folder names in one query', async () => {
		const service = createMockService({
			documentSets: [
				{ id: COVER_LETTER_DOCUMENT_SET_ID, folderName: TEST_DOCUMENT_SET_FOLDER_NAME },
				{ id: DOCUMENT_SET_ID.G2_LOCAL_PLAN_TIMETABLE, folderName: DOCUMENT_SET_FOLDER_NAME.G2_LOCAL_PLAN_TIMETABLE }
			]
		});

		const documentSetIdsByFolderName = await getDocumentSetIdsByFolderName(service as unknown as ManageService, [
			TEST_DOCUMENT_SET_FOLDER_NAME,
			DOCUMENT_SET_FOLDER_NAME.G2_LOCAL_PLAN_TIMETABLE,
			TEST_DOCUMENT_SET_FOLDER_NAME
		]);

		assert.deepEqual(service.db.documentSet.findMany.mock.calls[0].arguments[0], {
			where: {
				folderName: {
					in: [TEST_DOCUMENT_SET_FOLDER_NAME, DOCUMENT_SET_FOLDER_NAME.G2_LOCAL_PLAN_TIMETABLE]
				}
			},
			select: {
				id: true,
				folderName: true
			}
		});
		assert.equal(documentSetIdsByFolderName.get(TEST_DOCUMENT_SET_FOLDER_NAME), COVER_LETTER_DOCUMENT_SET_ID);
		assert.equal(
			documentSetIdsByFolderName.get(DOCUMENT_SET_FOLDER_NAME.G2_LOCAL_PLAN_TIMETABLE),
			DOCUMENT_SET_ID.G2_LOCAL_PLAN_TIMETABLE
		);
	});

	it('rejects when any requested document set is missing', async () => {
		const service = createMockService({
			documentSets: [{ id: COVER_LETTER_DOCUMENT_SET_ID, folderName: TEST_DOCUMENT_SET_FOLDER_NAME }]
		});

		await assert.rejects(
			() =>
				getDocumentSetIdsByFolderName(service as unknown as ManageService, [
					TEST_DOCUMENT_SET_FOLDER_NAME,
					DOCUMENT_SET_FOLDER_NAME.G2_LOCAL_PLAN_TIMETABLE
				]),
			/Missing document set reference data for "local-plan-timetable"/
		);
	});
});

describe('saveDocuments', () => {
	it('creates a document and version for a new uploaded file', async () => {
		const tx = createTransactionClient();
		const service = createMockService({ tx });
		const uploadedFile = buildUploadedFile();

		await saveDocuments(service as unknown as ManageService, buildRequest(), TEST_DOCUMENT_SET_FOLDER_NAME, [
			uploadedFile
		]);

		assert.equal(service.db.documentSet.findFirst.mock.callCount(), 1);
		assert.equal(tx.document.create.mock.callCount(), 1);
		assert.equal(tx.documentVersion.create.mock.callCount(), 1);
		assert.equal(tx.document.update.mock.callCount(), 1);

		const documentCreateData = tx.document.create.mock.calls[0].arguments[0].data;
		assert.equal(documentCreateData.name, uploadedFile.id);
		assert.equal(documentCreateData.caseId, 'case-1');
		assert.equal(documentCreateData.documentSetId, COVER_LETTER_DOCUMENT_SET_ID);

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

		await saveDocuments(service as unknown as ManageService, buildRequest(), TEST_DOCUMENT_SET_FOLDER_NAME, []);

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

	it('restores a soft-deleted document when the same document ID is uploaded again', async () => {
		const tx = createTransactionClient();
		const service = createMockService({
			tx,
			existingDocuments: [
				buildDocumentRow({
					guid: 'document-1',
					isDeleted: true,
					latestDocumentVersion: {
						version: 3,
						originalFilename: 'cover-letter.pdf',
						fileName: 'cover-letter.pdf',
						mime: 'application/pdf',
						size: 100,
						blobStorageContainer: 'local-planning-documents',
						blobStoragePath: 'gateway-2/cover-letter.pdf',
						documentURI: 'http://storage/cover-letter.pdf',
						isDeleted: true
					}
				})
			]
		});

		await saveDocuments(service as unknown as ManageService, buildRequest(), TEST_DOCUMENT_SET_FOLDER_NAME, [
			buildUploadedFile({ id: 'document-1' })
		]);

		assert.equal(tx.document.create.mock.callCount(), 0);
		assert.equal(tx.documentVersion.create.mock.callCount(), 0);
		assert.deepEqual(tx.document.update.mock.calls[0].arguments[0], {
			where: {
				guid: 'document-1'
			},
			data: {
				isDeleted: false
			}
		});
		assert.deepEqual(tx.documentVersion.update.mock.calls[0].arguments[0], {
			where: {
				documentGuid_version: {
					documentGuid: 'document-1',
					version: 3
				}
			},
			data: {
				isDeleted: false
			}
		});
	});

	it('restores a soft-deleted document without a latest document version', async () => {
		const tx = createTransactionClient();
		const service = createMockService({
			tx,
			existingDocuments: [
				buildDocumentRow({
					guid: 'document-1',
					isDeleted: true,
					latestDocumentVersion: null
				})
			]
		});

		await saveDocuments(service as unknown as ManageService, buildRequest(), TEST_DOCUMENT_SET_FOLDER_NAME, [
			buildUploadedFile({ id: 'document-1' })
		]);

		assert.equal(tx.document.create.mock.callCount(), 0);
		assert.equal(tx.documentVersion.create.mock.callCount(), 0);
		assert.equal(tx.documentVersion.update.mock.callCount(), 0);
		assert.deepEqual(tx.document.update.mock.calls[0].arguments[0], {
			where: {
				guid: 'document-1'
			},
			data: {
				isDeleted: false
			}
		});
	});

	it('rejects save when the document set reference data is missing', async () => {
		const service = createMockService({ documentSet: null });

		await assert.rejects(
			() =>
				saveDocuments(service as unknown as ManageService, buildRequest(), TEST_DOCUMENT_SET_FOLDER_NAME, [
					buildUploadedFile()
				]),
			/Missing document set reference data for "gateway-2-cover-letter"/
		);
		assert.equal(service.db.$transaction.mock.callCount(), 0);
	});

	it('requires a loaded case on the request', async () => {
		const service = createMockService();

		await assert.rejects(
			() =>
				saveDocuments(service as unknown as ManageService, {} as Request, TEST_DOCUMENT_SET_FOLDER_NAME, [
					buildUploadedFile()
				]),
			/Cannot save documents without a loaded case/
		);
		assert.equal(service.db.documentSet.findFirst.mock.callCount(), 0);
	});
});

describe('getLatestDocumentBlobDetails', () => {
	it('can extract the blob details from the latest document', async () => {
		const documentId = 'document-1';
		const service = createMockService({
			existingDocuments: [
				buildDocumentRow({
					guid: documentId,
					isDeleted: false,
					latestDocumentVersion: {
						blobStorageContainer: 'some-blob-container',
						blobStoragePath: 'a/path/to/myblob.txt',
						fileName: 'myblob.txt'
					}
				})
			]
		});
		const expectedBlobDetails = {
			containerName: 'some-blob-container',
			blobPath: 'a/path/to/myblob.txt',
			fileName: 'myblob.txt'
		};
		const actualBlobDetails = await getLatestDocumentBlobDetails(service as unknown as ManageService, documentId);
		assert.deepEqual(actualBlobDetails, expectedBlobDetails);
	});
	it('rejects queries that cannot find a document', async () => {
		const documentId = 'document-1';
		const service = createMockService({});
		assert.rejects(async () => {
			await getLatestDocumentBlobDetails(service as unknown as ManageService, documentId);
		}, /Could not find an active document version for 'document-1'/);
	});
	it('rejects queries that have no latest version of the document', async () => {
		const documentId = 'document-1';
		const service = createMockService({
			existingDocuments: [
				buildDocumentRow({
					guid: documentId,
					isDeleted: false,
					latestDocumentVersion: null
				})
			]
		});
		assert.rejects(async () => {
			await getLatestDocumentBlobDetails(service as unknown as ManageService, documentId);
		});
	});
	it('rejects cases where the container name is missing from the latest document version', async () => {
		const documentId = 'document-1';
		const service = createMockService({
			existingDocuments: [
				buildDocumentRow({
					guid: documentId,
					isDeleted: false,
					latestDocumentVersion: {
						blobStorageContainer: undefined,
						blobStoragePath: 'a/path/to/myblob.txt',
						fileName: 'myblob.txt'
					}
				})
			]
		});
		assert.rejects(async () => {
			await getLatestDocumentBlobDetails(service as unknown as ManageService, documentId);
		});
	});
	it('rejects cases where the blob path is missing from the latest document version', async () => {
		const documentId = 'document-1';
		const service = createMockService({
			existingDocuments: [
				buildDocumentRow({
					guid: documentId,
					isDeleted: false,
					latestDocumentVersion: {
						blobStorageContainer: 'some-blob-container',
						blobStoragePath: undefined,
						fileName: 'myblob.txt'
					}
				})
			]
		});
		assert.rejects(async () => {
			await getLatestDocumentBlobDetails(service as unknown as ManageService, documentId);
		});
	});
	it('rejects cases where the file name is missing from the latest document version', async () => {
		const documentId = 'document-1';
		const service = createMockService({
			existingDocuments: [
				buildDocumentRow({
					guid: documentId,
					isDeleted: false,
					latestDocumentVersion: {
						blobStorageContainer: 'some-blob-container',
						blobStoragePath: 'a/path/to/myblob.txt',
						fileName: undefined
					}
				})
			]
		});
		assert.rejects(async () => {
			await getLatestDocumentBlobDetails(service as unknown as ManageService, documentId);
		});
	});
});

function createMockService({
	documentSet = { id: COVER_LETTER_DOCUMENT_SET_ID },
	documentSets = [{ id: COVER_LETTER_DOCUMENT_SET_ID, folderName: TEST_DOCUMENT_SET_FOLDER_NAME }],
	existingDocuments = [],
	tx = createTransactionClient()
}: {
	documentSet?: { id: string } | null;
	documentSets?: { id: string; folderName: string }[];
	existingDocuments?: unknown[];
	tx?: ReturnType<typeof createTransactionClient>;
} = {}) {
	return {
		db: {
			documentSet: {
				findFirst: mock.fn(async () => documentSet),
				findMany: mock.fn(async () => documentSets)
			},
			document: {
				findMany: mock.fn(async () => existingDocuments),
				findFirst: mock.fn(async () => existingDocuments[0])
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
		documentSetId: COVER_LETTER_DOCUMENT_SET_ID,
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
