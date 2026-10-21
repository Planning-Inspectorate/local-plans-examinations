import assert from 'node:assert/strict';
import type { Request, Response } from 'express';
import { describe, it, mock, beforeEach } from 'node:test';
import type { Service } from '@pins/local-plans-lib/app/service.ts';
import {
	DOCUMENT_SET_FOLDER_NAME,
	DOCUMENT_SET_ID
} from '@pins/local-plans-database/src/seed/static-data/ids/index.ts';
import type { UploadedFile } from '@pins/local-plans-lib/forms/custom-components/file-uploader/index.ts';
import { DocumentUtil } from './documents.ts';

const COVER_LETTER_DOCUMENT_SET_ID = DOCUMENT_SET_ID.G2_COVER_LETTER;
const TEST_DOCUMENT_SET_FOLDER_NAME = DOCUMENT_SET_FOLDER_NAME.G2_COVER_LETTER;
const DOCUMENT_CREATED_DATE = new Date();
const MOCK_BLOB_STORAGE_UTIL = {
	downloadToExpressResponse: mock.fn(async () => null)
};

describe('loadUploadedDocuments', () => {
	it('loads documents as uploaded files', async () => {
		const service = createMockService({
			existingDocuments: [
				{
					guid: 'document-1',
					name: 'stored-file',
					documentSetId: COVER_LETTER_DOCUMENT_SET_ID,
					isDeleted: false,
					isTemp: false,
					latestDocumentVersion: {
						version: 1,
						originalFilename: 'cover-letter.pdf',
						fileName: 'stored-cover-letter.pdf',
						mime: 'application/pdf',
						size: 123,
						blobStorageContainer: 'local-planning-documents',
						blobStoragePath: 'gateway-2/cover-letter.pdf',
						documentURI: 'http://storage/cover-letter.pdf',
						isDeleted: false,
						dateCreated: DOCUMENT_CREATED_DATE,
						virusCheckStatus: 'scanned'
					}
				}
			]
		});

		const files = await DocumentUtil.loadUploadedDocuments(
			service as unknown as Service,
			'case-1',
			COVER_LETTER_DOCUMENT_SET_ID
		);

		assert.deepEqual(files, [
			{
				id: 'stored-file',
				fileName: 'cover-letter.pdf',
				mimeType: 'application/pdf',
				size: 123,
				storageProvider: 'blob',
				containerName: 'local-planning-documents',
				path: 'gateway-2/cover-letter.pdf',
				url: 'http://storage/cover-letter.pdf',
				dateCreated: DOCUMENT_CREATED_DATE,
				isTemp: false,
				virusCheckStatus: 'scanned',
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
				isDeleted: false,
				isTemp: false
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

		const documentSetIdsByFolderName = await DocumentUtil.getDocumentSetIdsByFolderName(service as unknown as Service, [
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
				DocumentUtil.getDocumentSetIdsByFolderName(service as unknown as Service, [
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

		await DocumentUtil.saveDocuments(service as unknown as Service, buildRequest(), TEST_DOCUMENT_SET_FOLDER_NAME, [
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

		await DocumentUtil.saveDocuments(service as unknown as Service, buildRequest(), TEST_DOCUMENT_SET_FOLDER_NAME, []);

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

		await DocumentUtil.saveDocuments(service as unknown as Service, buildRequest(), TEST_DOCUMENT_SET_FOLDER_NAME, [
			buildUploadedFile({ id: 'gateway-2/cover-letter.pdf' })
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

		await DocumentUtil.saveDocuments(service as unknown as Service, buildRequest(), TEST_DOCUMENT_SET_FOLDER_NAME, [
			buildUploadedFile({ id: 'gateway-2/cover-letter.pdf' })
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
				DocumentUtil.saveDocuments(service as unknown as Service, buildRequest(), TEST_DOCUMENT_SET_FOLDER_NAME, [
					buildUploadedFile()
				]),
			/Missing document set reference data for "covering-letter"/
		);
		assert.equal(service.db.$transaction.mock.callCount(), 0);
	});

	it('requires a loaded case on the request', async () => {
		const service = createMockService();

		await assert.rejects(
			() =>
				DocumentUtil.saveDocuments(service as unknown as Service, {} as Request, TEST_DOCUMENT_SET_FOLDER_NAME, [
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
		const actualBlobDetails = await DocumentUtil.getLatestDocumentBlobDetails(
			service as unknown as Service,
			documentId
		);
		assert.deepEqual(actualBlobDetails, expectedBlobDetails);
	});
	it('rejects queries that cannot find a document', async () => {
		const documentId = 'document-1';
		const service = createMockService({});
		assert.rejects(async () => {
			await DocumentUtil.getLatestDocumentBlobDetails(service as unknown as Service, documentId);
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
			await DocumentUtil.getLatestDocumentBlobDetails(service as unknown as Service, documentId);
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
			await DocumentUtil.getLatestDocumentBlobDetails(service as unknown as Service, documentId);
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
			await DocumentUtil.getLatestDocumentBlobDetails(service as unknown as Service, documentId);
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
			await DocumentUtil.getLatestDocumentBlobDetails(service as unknown as Service, documentId);
		});
	});
});

describe('downloadDocumentToResponse', () => {
	const service = createMockService();
	const blobDetails = {
		blobPath: 'some/blob/path',
		fileName: 'somefilename'
	};
	const res = {};
	it('can download blob data to a response object', async () => {
		mock.method(DocumentUtil, 'getLatestDocumentBlobDetails', async () => blobDetails);
		await DocumentUtil.downloadDocumentToResponse(service as unknown as Service, '1', res as unknown as Response);
		assert.deepStrictEqual(MOCK_BLOB_STORAGE_UTIL.downloadToExpressResponse.mock.calls[0].arguments, [
			blobDetails.blobPath,
			blobDetails.fileName,
			res
		]);
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
		logger: {
			error: mock.fn(),
			warn: mock.fn()
		},
		db: {
			documentSet: {
				findFirst: mock.fn(async () => documentSet),
				findMany: mock.fn(async () => documentSets)
			},
			document: {
				findMany: mock.fn(async () => existingDocuments),
				findFirst: mock.fn(async () => existingDocuments[0]),
				update: mock.fn(async () => ({})),
				updateMany: mock.fn(async () => ({}))
			},
			$transaction: mock.fn(async (callback: (tx: typeof tx) => unknown) => callback(tx))
		},
		createFileStorage: mock.fn(() => MOCK_BLOB_STORAGE_UTIL)
	};
}

function createTransactionClient() {
	return {
		document: {
			create: mock.fn(async () => ({})),
			update: mock.fn(async () => ({})),
			updateMany: mock.fn(async () => ({}))
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
		isTemp: false,
		...overrides
	};
}

function buildDocumentRow(overrides: Record<string, unknown> = {}) {
	return {
		guid: 'document-1',
		name: 'gateway-2/cover-letter.pdf',
		documentSetId: COVER_LETTER_DOCUMENT_SET_ID,
		isDeleted: false,
		isTemp: false,
		latestDocumentVersion: {
			version: 1,
			originalFilename: 'cover-letter.pdf',
			fileName: 'cover-letter.pdf',
			mime: 'application/pdf',
			size: 100,
			blobStorageContainer: 'local-planning-documents',
			blobStoragePath: 'gateway-2/cover-letter.pdf',
			documentURI: 'http://storage/cover-letter.pdf',
			virusCheckStatus: 'scanned',
			isDeleted: false,
			dateCreated: DOCUMENT_CREATED_DATE
		},
		...overrides
	};
}

describe('updateTemporaryDocumentToPermanent', () => {
	let service: ReturnType<typeof createMockService>;

	beforeEach(() => {
		const tx = createTransactionClient();
		const documentRow = buildDocumentRow({ isTemp: true });
		service = createMockService({ tx, existingDocuments: [documentRow] });
	});

	const run = (files: ReturnType<typeof buildUploadedFile>[]) =>
		DocumentUtil.updateTemporaryDocumentToPermanent(service as unknown as Service, files);

	const row = (guid: string, name: string) => ({ guid, name, isTemp: true });

	it('should change a temp document into a permanent document', async () => {
		service.db.document.findFirst.mock.mockImplementation(async () => row('g1', 'a.pdf'));

		await run([buildUploadedFile({ path: 'a.pdf' })]);

		assert.equal(service.db.document.updateMany.mock.callCount(), 1);
		assert.deepEqual(service.db.document.updateMany.mock.calls[0].arguments[0], {
			where: { guid: { in: ['g1'] } },
			data: { isTemp: false }
		});
		assert.equal(service.logger.error.mock.callCount(), 0);
	});

	it('should look up each uploaded file by its path', async () => {
		const rows: Record<string, ReturnType<typeof row>> = {
			'a.pdf': row('g1', 'a.pdf'),
			'b.pdf': row('g2', 'b.pdf')
		};
		service.db.document.findFirst.mock.mockImplementation(async ({ where }) => rows[where.name] ?? null);

		await run([buildUploadedFile({ path: 'a.pdf' }), buildUploadedFile({ path: 'b.pdf' })]);

		assert.equal(service.db.document.findFirst.mock.callCount(), 2);
		assert.deepEqual(service.db.document.findFirst.mock.calls[0].arguments[0], { where: { name: 'a.pdf' } });
		assert.deepEqual(service.db.document.findFirst.mock.calls[1].arguments[0], { where: { name: 'b.pdf' } });
	});

	it('should update every found document in a single query', async () => {
		const rows: Record<string, ReturnType<typeof row>> = {
			'a.pdf': row('g1', 'a.pdf'),
			'b.pdf': row('g2', 'b.pdf')
		};
		service.db.document.findFirst.mock.mockImplementation(async ({ where }) => rows[where.name] ?? null);

		await run([buildUploadedFile({ path: 'a.pdf' }), buildUploadedFile({ path: 'b.pdf' })]);

		assert.equal(service.db.document.updateMany.mock.callCount(), 1);
		assert.deepEqual(service.db.document.updateMany.mock.calls[0].arguments[0], {
			where: { guid: { in: ['g1', 'g2'] } },
			data: { isTemp: false }
		});
		assert.equal(service.logger.error.mock.callCount(), 0);
	});

	it('should do nothing when given no files', async () => {
		await run([]);

		assert.equal(service.db.document.findFirst.mock.callCount(), 0);
		assert.equal(service.db.document.updateMany.mock.callCount(), 0);
		assert.equal(service.logger.error.mock.callCount(), 0);
	});

	it('should throw and not update when some files are not found', async () => {
		service.db.document.findFirst.mock.mockImplementation(async ({ where }) =>
			where.name === 'a.pdf' ? row('g1', 'a.pdf') : null
		);

		await assert.rejects(
			run([buildUploadedFile({ path: 'a.pdf' }), buildUploadedFile({ path: 'missing.pdf' })]),
			/not all files found/
		);

		assert.equal(service.db.document.updateMany.mock.callCount(), 0);
		assert.equal(service.logger.error.mock.callCount(), 1);
	});

	it('should throw and not update when no files are found', async () => {
		service.db.document.findFirst.mock.mockImplementation(async () => null);

		await assert.rejects(run([buildUploadedFile({ path: 'missing.pdf' })]), /not all files found/);

		assert.equal(service.db.document.updateMany.mock.callCount(), 0);
		assert.equal(service.logger.error.mock.callCount(), 1);
	});

	it('should log and rethrow when a lookup fails', async () => {
		const dbError = new Error('lookup failed');
		service.db.document.findFirst.mock.mockImplementation(async () => {
			throw dbError;
		});

		await assert.rejects(run([buildUploadedFile({ path: 'a.pdf' })]), dbError);

		assert.equal(service.db.document.updateMany.mock.callCount(), 0);
		assert.equal(service.logger.error.mock.callCount(), 1);
		assert.equal(service.logger.error.mock.calls[0].arguments[0], dbError);
	});

	it('should log and rethrow when the update fails', async () => {
		const dbError = new Error('update failed');
		service.db.document.findFirst.mock.mockImplementation(async () => row('g1', 'a.pdf'));
		service.db.document.updateMany.mock.mockImplementation(async () => {
			throw dbError;
		});

		await assert.rejects(run([buildUploadedFile({ path: 'a.pdf' })]), dbError);

		assert.equal(service.logger.error.mock.callCount(), 1);
		assert.equal(service.logger.error.mock.calls[0].arguments[0], dbError);
	});
});

type DocumentRows = Parameters<typeof DocumentUtil.deleteDocuments>[0]['existingDocuments'];

function asDocumentRows(documents: unknown[]): DocumentRows {
	return documents as DocumentRows;
}
describe('findExistingDocuments', () => {
	const findExistingDocuments = (service: ReturnType<typeof createMockService>, request: Request = buildRequest()) =>
		DocumentUtil.findExistingDocuments({
			service: service as unknown as Service,
			request,
			documentSetFolderName: TEST_DOCUMENT_SET_FOLDER_NAME
		});

	it('loads every document in the document set for the current case, including soft-deleted ones', async () => {
		const activeDocument = buildDocumentRow({ guid: 'document-1' });
		const deletedDocument = buildDocumentRow({ guid: 'document-2', isDeleted: true });
		const service = createMockService({ existingDocuments: [activeDocument, deletedDocument] });

		const existingDocuments = await findExistingDocuments(service);

		assert.deepEqual(existingDocuments, [activeDocument, deletedDocument]);
		assert.deepEqual(service.db.document.findMany.mock.calls[0].arguments[0], {
			where: {
				caseId: 'case-1',
				documentSetId: COVER_LETTER_DOCUMENT_SET_ID
			},
			include: {
				latestDocumentVersion: true
			}
		});
	});

	it('returns an empty list when the case has no documents in the document set', async () => {
		const service = createMockService({ existingDocuments: [] });

		const existingDocuments = await findExistingDocuments(service);

		assert.deepEqual(existingDocuments, []);
	});

	it('rejects when the document set reference data is missing', async () => {
		const service = createMockService({ documentSet: null });

		await assert.rejects(
			() => findExistingDocuments(service),
			/Missing document set reference data for "covering-letter"/
		);
		assert.equal(service.db.document.findMany.mock.callCount(), 0);
	});

	it('requires a loaded case on the request', async () => {
		const service = createMockService();

		await assert.rejects(
			() => findExistingDocuments(service, {} as Request),
			/Cannot find documents without a loaded case/
		);
		assert.equal(service.db.documentSet.findFirst.mock.callCount(), 0);
	});
});

describe('saveDocumentsOverride', () => {
	const saveDocumentsOverride = (
		service: ReturnType<typeof createMockService>,
		{
			request = buildRequest(),
			uploadedFiles,
			existingDocuments = [],
			isTemp = true
		}: {
			request?: Request;
			uploadedFiles: UploadedFile[];
			existingDocuments?: unknown[];
			isTemp?: boolean;
		}
	) =>
		DocumentUtil.saveDocumentsOverride({
			service: service as unknown as Service,
			request,
			documentSetFolderName: TEST_DOCUMENT_SET_FOLDER_NAME,
			temporaryUploadedFiles: uploadedFiles,
			existingDocuments: asDocumentRows(existingDocuments),
			isTemp
		});

	it('creates documents only for uploaded files that are not already stored', async () => {
		const transactionClient = createTransactionClient();
		const service = createMockService({ tx: transactionClient });
		const storedFile = buildUploadedFile({ id: 'gateway-2/stored.pdf', path: 'gateway-2/stored.pdf' });
		const newFile = buildUploadedFile({ id: 'gateway-2/new.pdf', path: 'gateway-2/new.pdf', fileName: 'new.pdf' });
		const storedDocument = buildDocumentRow({ guid: 'document-1', name: 'gateway-2/stored.pdf' });

		await saveDocumentsOverride(service, {
			uploadedFiles: [storedFile, newFile],
			existingDocuments: [storedDocument]
		});

		assert.equal(transactionClient.document.create.mock.callCount(), 1);
		const createdDocumentData = transactionClient.document.create.mock.calls[0].arguments[0].data;
		assert.equal(createdDocumentData.name, 'gateway-2/new.pdf');
		assert.equal(createdDocumentData.caseId, 'case-1');
		assert.equal(createdDocumentData.documentSetId, COVER_LETTER_DOCUMENT_SET_ID);
	});

	for (const isTemp of [true, false]) {
		it(`creates documents with isTemp set to ${isTemp}`, async () => {
			const transactionClient = createTransactionClient();
			const service = createMockService({ tx: transactionClient });

			await saveDocumentsOverride(service, { uploadedFiles: [buildUploadedFile()], isTemp });

			const createdDocumentData = transactionClient.document.create.mock.calls[0].arguments[0].data;
			assert.equal(createdDocumentData.isTemp, isTemp);
		});
	}

	it('creates a new document when the stored document with the same name is soft-deleted', async () => {
		const transactionClient = createTransactionClient();
		const service = createMockService({ tx: transactionClient });
		const deletedDocument = buildDocumentRow({
			guid: 'document-1',
			name: 'gateway-2/cover-letter.pdf',
			isDeleted: true
		});

		await saveDocumentsOverride(service, {
			uploadedFiles: [buildUploadedFile()],
			existingDocuments: [deletedDocument]
		});

		assert.equal(transactionClient.document.create.mock.callCount(), 1);
	});

	it('does not create documents when every uploaded file is already stored', async () => {
		const transactionClient = createTransactionClient();
		const service = createMockService({ tx: transactionClient });

		await saveDocumentsOverride(service, {
			uploadedFiles: [buildUploadedFile()],
			existingDocuments: [buildDocumentRow({ name: 'gateway-2/cover-letter.pdf' })]
		});

		assert.equal(transactionClient.document.create.mock.callCount(), 0);
		assert.equal(transactionClient.documentVersion.create.mock.callCount(), 0);
	});

	it('rejects when the document set reference data is missing', async () => {
		const service = createMockService({ documentSet: null });

		await assert.rejects(
			() => saveDocumentsOverride(service, { uploadedFiles: [buildUploadedFile()] }),
			/Missing document set reference data for "covering-letter"/
		);
		assert.equal(service.db.$transaction.mock.callCount(), 0);
	});

	it('requires a loaded case on the request', async () => {
		const service = createMockService();

		await assert.rejects(
			() => saveDocumentsOverride(service, { request: {} as Request, uploadedFiles: [buildUploadedFile()] }),
			/Cannot save documents without a loaded case/
		);
		assert.equal(service.db.documentSet.findFirst.mock.callCount(), 0);
		assert.equal(service.db.$transaction.mock.callCount(), 0);
	});
});

describe('restoreDocuments', () => {
	const restoreDocuments = (
		service: ReturnType<typeof createMockService>,
		uploadedFiles: UploadedFile[],
		existingDocuments: unknown[]
	) =>
		DocumentUtil.restoreDocuments({
			service: service as unknown as Service,
			temporaryUploadedFiles: uploadedFiles,
			existingDocuments: asDocumentRows(existingDocuments)
		});

	it('restores a soft-deleted document that is still in the upload list', async () => {
		const transactionClient = createTransactionClient();
		const service = createMockService({ tx: transactionClient });
		const deletedDocument = buildDocumentRow({
			guid: 'document-1',
			isDeleted: true,
			latestDocumentVersion: { ...buildDocumentRow().latestDocumentVersion, version: 2, isDeleted: true }
		});

		await restoreDocuments(service, [buildUploadedFile({ id: deletedDocument.name })], [deletedDocument]);

		assert.deepEqual(transactionClient.document.update.mock.calls[0].arguments[0], {
			where: {
				guid: 'document-1'
			},
			data: {
				isDeleted: false
			}
		});
		assert.deepEqual(transactionClient.documentVersion.update.mock.calls[0].arguments[0], {
			where: {
				documentGuid_version: {
					documentGuid: 'document-1',
					version: 2
				}
			},
			data: {
				isDeleted: false
			}
		});
	});

	it('restores a document whose latest version alone is soft-deleted', async () => {
		const transactionClient = createTransactionClient();
		const service = createMockService({ tx: transactionClient });
		const documentWithDeletedVersion = buildDocumentRow({
			guid: 'document-1',
			isDeleted: false,
			latestDocumentVersion: { ...buildDocumentRow().latestDocumentVersion, isDeleted: true }
		});

		await restoreDocuments(
			service,
			[buildUploadedFile({ id: documentWithDeletedVersion.name })],
			[documentWithDeletedVersion]
		);

		assert.equal(service.db.$transaction.mock.callCount(), 1);
		assert.deepEqual(transactionClient.documentVersion.update.mock.calls[0].arguments[0], {
			where: {
				documentGuid_version: {
					documentGuid: 'document-1',
					version: 1
				}
			},
			data: {
				isDeleted: false
			}
		});
	});

	it('restores each document in its own transaction', async () => {
		const transactionClient = createTransactionClient();
		const service = createMockService({ tx: transactionClient });
		const firstDeletedDocument = buildDocumentRow({ guid: 'document-1', name: 'gateway-2/first.pdf', isDeleted: true });
		const secondDeletedDocument = buildDocumentRow({
			guid: 'document-2',
			name: 'gateway-2/second.pdf',
			isDeleted: true
		});

		await restoreDocuments(
			service,
			[buildUploadedFile({ id: firstDeletedDocument.name }), buildUploadedFile({ id: secondDeletedDocument.name })],
			[firstDeletedDocument, secondDeletedDocument]
		);

		assert.equal(service.db.$transaction.mock.callCount(), 2);
		const restoredDocumentGuids = transactionClient.document.update.mock.calls.map(
			(updateCall) => updateCall.arguments[0].where.guid
		);
		assert.deepEqual(restoredDocumentGuids, ['document-1', 'document-2']);
	});

	it('does not restore soft-deleted documents that are not in the upload list', async () => {
		const service = createMockService();
		const deletedDocument = buildDocumentRow({ guid: 'document-1', isDeleted: true });

		await restoreDocuments(service, [buildUploadedFile({ id: 'gateway-2/other.pdf' })], [deletedDocument]);

		assert.equal(service.db.$transaction.mock.callCount(), 0);
	});

	it('leaves active documents untouched', async () => {
		const service = createMockService();
		const activeDocument = buildDocumentRow({ guid: 'document-1' });

		await restoreDocuments(service, [buildUploadedFile({ id: activeDocument.name })], [activeDocument]);

		assert.equal(service.db.$transaction.mock.callCount(), 0);
	});
});

describe('deleteDocuments', () => {
	const deleteDocuments = (
		service: ReturnType<typeof createMockService>,
		uploadedFiles: UploadedFile[],
		existingDocuments: unknown[]
	) =>
		DocumentUtil.deleteDocuments({
			service: service as unknown as Service,
			temporaryUploadedFiles: uploadedFiles,
			existingDocuments: asDocumentRows(existingDocuments)
		});

	it('removes the selected upload by its stored name without deleting the issued document', async () => {
		const transactionClient = createTransactionClient();
		const service = createMockService({ tx: transactionClient });
		const issuedDocument = buildDocumentRow({ guid: 'issued-document', name: 'gateway-2/issued.pdf' });
		const replacement = buildDocumentRow({
			guid: 'replacement-document',
			name: 'gateway-2/replacement.pdf',
			isTemp: true
		});

		await DocumentUtil.deleteDocuments({
			service: service as unknown as Service,
			temporaryUploadedFiles: [],
			existingDocuments: asDocumentRows([issuedDocument, replacement]),
			fileId: replacement.name
		});

		assert.equal(transactionClient.document.update.mock.callCount(), 1);
		assert.equal(transactionClient.document.update.mock.calls[0].arguments[0].where.guid, replacement.guid);
		assert.deepEqual(transactionClient.documentVersion.updateMany.mock.calls[0].arguments[0], {
			where: { documentGuid: replacement.guid },
			data: { isDeleted: true }
		});
	});

	it('does not delete another document when the selected upload is not found', async () => {
		const transactionClient = createTransactionClient();
		const service = createMockService({ tx: transactionClient });

		await DocumentUtil.deleteDocuments({
			service: service as unknown as Service,
			temporaryUploadedFiles: [],
			existingDocuments: asDocumentRows([buildDocumentRow()]),
			fileId: 'gateway-2/missing.pdf'
		});

		assert.equal(transactionClient.document.update.mock.callCount(), 0);
		assert.equal(transactionClient.documentVersion.updateMany.mock.callCount(), 0);
	});

	it('soft-deletes documents that are no longer in the upload list', async () => {
		const transactionClient = createTransactionClient();
		const service = createMockService({ tx: transactionClient });
		const keptDocument = buildDocumentRow({ guid: 'document-1', name: 'gateway-2/kept.pdf' });
		const removedDocument = buildDocumentRow({ guid: 'document-2', name: 'gateway-2/removed.pdf' });

		await deleteDocuments(service, [buildUploadedFile({ id: keptDocument.name })], [keptDocument, removedDocument]);

		assert.equal(transactionClient.document.update.mock.callCount(), 1);
		assert.deepEqual(transactionClient.document.update.mock.calls[0].arguments[0], {
			where: {
				guid: 'document-2'
			},
			data: {
				isDeleted: true
			}
		});
		assert.deepEqual(transactionClient.documentVersion.updateMany.mock.calls[0].arguments[0], {
			where: {
				documentGuid: 'document-2'
			},
			data: {
				isDeleted: true
			}
		});
	});

	it('soft-deletes every removed document in a single transaction', async () => {
		const transactionClient = createTransactionClient();
		const service = createMockService({ tx: transactionClient });
		const firstRemovedDocument = buildDocumentRow({ guid: 'document-1' });
		const secondRemovedDocument = buildDocumentRow({ guid: 'document-2' });

		await deleteDocuments(service, [], [firstRemovedDocument, secondRemovedDocument]);

		assert.equal(service.db.$transaction.mock.callCount(), 1);
		const deletedDocumentGuids = transactionClient.document.update.mock.calls.map(
			(updateCall) => updateCall.arguments[0].where.guid
		);
		assert.deepEqual(deletedDocumentGuids, ['document-1', 'document-2']);
	});

	it('skips documents that are already fully soft-deleted', async () => {
		const transactionClient = createTransactionClient();
		const service = createMockService({ tx: transactionClient });
		const fullyDeletedDocument = buildDocumentRow({
			guid: 'document-1',
			isDeleted: true,
			latestDocumentVersion: { ...buildDocumentRow().latestDocumentVersion, isDeleted: true }
		});

		await deleteDocuments(service, [], [fullyDeletedDocument]);

		assert.equal(transactionClient.document.update.mock.callCount(), 0);
		assert.equal(transactionClient.documentVersion.updateMany.mock.callCount(), 0);
	});

	it('soft-deletes the versions of a deleted document whose latest version is still active', async () => {
		const transactionClient = createTransactionClient();
		const service = createMockService({ tx: transactionClient });
		const partiallyDeletedDocument = buildDocumentRow({ guid: 'document-1', isDeleted: true });

		await deleteDocuments(service, [], [partiallyDeletedDocument]);

		assert.deepEqual(transactionClient.documentVersion.updateMany.mock.calls[0].arguments[0], {
			where: {
				documentGuid: 'document-1'
			},
			data: {
				isDeleted: true
			}
		});
	});

	it('does not delete anything when every existing document is still uploaded', async () => {
		const transactionClient = createTransactionClient();
		const service = createMockService({ tx: transactionClient });
		const firstDocument = buildDocumentRow({ guid: 'document-1', name: 'gateway-2/first.pdf' });
		const secondDocument = buildDocumentRow({ guid: 'document-2', name: 'gateway-2/second.pdf' });

		await deleteDocuments(
			service,
			[buildUploadedFile({ id: firstDocument.name }), buildUploadedFile({ id: secondDocument.name })],
			[firstDocument, secondDocument]
		);

		assert.equal(transactionClient.document.update.mock.callCount(), 0);
		assert.equal(transactionClient.documentVersion.updateMany.mock.callCount(), 0);
	});
});

describe('loadTempUploadedDocuments', () => {
	it('loads temporary documents as uploaded files', async () => {
		const temporaryDocument = buildDocumentRow({ guid: 'document-1', isTemp: true });
		const service = createMockService({ existingDocuments: [temporaryDocument] });

		const temporaryFiles = await DocumentUtil.loadTempUploadedDocuments(
			service as unknown as Service,
			'case-1',
			COVER_LETTER_DOCUMENT_SET_ID
		);

		assert.deepEqual(temporaryFiles, [
			{
				id: temporaryDocument.name,
				fileName: 'cover-letter.pdf',
				mimeType: 'application/pdf',
				size: 100,
				storageProvider: 'blob',
				containerName: 'local-planning-documents',
				path: 'gateway-2/cover-letter.pdf',
				url: 'http://storage/cover-letter.pdf',
				dateCreated: DOCUMENT_CREATED_DATE,
				virusCheckStatus: 'scanned',
				isTemp: true,
				metadata: {
					documentGuid: 'document-1',
					documentSetId: COVER_LETTER_DOCUMENT_SET_ID,
					version: 1
				}
			}
		]);
	});

	it('queries only active temporary documents in creation order', async () => {
		const service = createMockService({ existingDocuments: [] });

		await DocumentUtil.loadTempUploadedDocuments(service as unknown as Service, 'case-1', COVER_LETTER_DOCUMENT_SET_ID);

		assert.deepEqual(service.db.document.findMany.mock.calls[0].arguments[0], {
			where: {
				caseId: 'case-1',
				documentSetId: COVER_LETTER_DOCUMENT_SET_ID,
				AND: [{ isDeleted: false }, { isTemp: true }]
			},
			include: {
				latestDocumentVersion: true
			},
			orderBy: {
				createdAt: 'asc'
			}
		});
	});

	it('skips temporary documents without a latest document version', async () => {
		const documentWithVersion = buildDocumentRow({ guid: 'document-1', isTemp: true });
		const documentWithoutVersion = buildDocumentRow({ guid: 'document-2', isTemp: true, latestDocumentVersion: null });
		const service = createMockService({ existingDocuments: [documentWithVersion, documentWithoutVersion] });

		const temporaryFiles = await DocumentUtil.loadTempUploadedDocuments(
			service as unknown as Service,
			'case-1',
			COVER_LETTER_DOCUMENT_SET_ID
		);

		assert.deepEqual(
			temporaryFiles.map((temporaryFile) => temporaryFile.id),
			[documentWithVersion.name]
		);
	});
});

describe('cleanUpTempDocuments', () => {
	it('soft-deletes every temporary document in the document set, each in its own transaction', async () => {
		const transactionClient = createTransactionClient();
		const service = createMockService({
			tx: transactionClient,
			existingDocuments: [
				buildDocumentRow({ guid: 'document-1', isTemp: true }),
				buildDocumentRow({ guid: 'document-2', isTemp: true })
			]
		});

		await DocumentUtil.cleanUpTempDocuments(service as unknown as Service, 'case-1', TEST_DOCUMENT_SET_FOLDER_NAME);

		assert.equal(service.db.documentSet.findFirst.mock.callCount(), 1);
		assert.equal(
			service.db.document.findMany.mock.calls[0].arguments[0].where.documentSetId,
			COVER_LETTER_DOCUMENT_SET_ID
		);
		assert.equal(service.db.$transaction.mock.callCount(), 2);
		assert.deepEqual(
			transactionClient.document.update.mock.calls.map((updateCall) => updateCall.arguments[0]),
			[
				{ where: { guid: 'document-1' }, data: { isDeleted: true } },
				{ where: { guid: 'document-2' }, data: { isDeleted: true } }
			]
		);
		assert.deepEqual(
			transactionClient.documentVersion.updateMany.mock.calls.map((updateCall) => updateCall.arguments[0]),
			[
				{ where: { documentGuid: 'document-1' }, data: { isDeleted: true } },
				{ where: { documentGuid: 'document-2' }, data: { isDeleted: true } }
			]
		);
	});

	it('does nothing when there are no temporary documents', async () => {
		const service = createMockService({ existingDocuments: [] });

		await DocumentUtil.cleanUpTempDocuments(service as unknown as Service, 'case-1', TEST_DOCUMENT_SET_FOLDER_NAME);

		assert.equal(service.db.$transaction.mock.callCount(), 0);
	});

	it('rejects when the document set reference data is missing', async () => {
		const service = createMockService({ documentSet: null });

		await assert.rejects(
			() => DocumentUtil.cleanUpTempDocuments(service as unknown as Service, 'case-1', TEST_DOCUMENT_SET_FOLDER_NAME),
			/Missing document set reference data for "covering-letter"/
		);
		assert.equal(service.db.document.findMany.mock.callCount(), 0);
	});
});

describe('findExistingDocuments', () => {
	const findExistingDocuments = (service: ReturnType<typeof createMockService>, request: Request = buildRequest()) =>
		DocumentUtil.findExistingDocuments({
			service: service as unknown as Service,
			request,
			documentSetFolderName: TEST_DOCUMENT_SET_FOLDER_NAME
		});

	it('loads every document in the document set for the current case, including soft-deleted ones', async () => {
		const activeDocument = buildDocumentRow({ guid: 'document-1' });
		const deletedDocument = buildDocumentRow({ guid: 'document-2', isDeleted: true });
		const service = createMockService({ existingDocuments: [activeDocument, deletedDocument] });

		const existingDocuments = await findExistingDocuments(service);

		assert.deepEqual(existingDocuments, [activeDocument, deletedDocument]);
		assert.deepEqual(service.db.document.findMany.mock.calls[0].arguments[0], {
			where: {
				caseId: 'case-1',
				documentSetId: COVER_LETTER_DOCUMENT_SET_ID
			},
			include: {
				latestDocumentVersion: true
			}
		});
	});

	it('returns an empty list when the case has no documents in the document set', async () => {
		const service = createMockService({ existingDocuments: [] });

		const existingDocuments = await findExistingDocuments(service);

		assert.deepEqual(existingDocuments, []);
	});

	it('rejects when the document set reference data is missing', async () => {
		const service = createMockService({ documentSet: null });

		await assert.rejects(
			() => findExistingDocuments(service),
			/Missing document set reference data for "covering-letter"/
		);
		assert.equal(service.db.document.findMany.mock.callCount(), 0);
	});

	it('requires a loaded case on the request', async () => {
		const service = createMockService();

		await assert.rejects(
			() => findExistingDocuments(service, {} as Request),
			/Cannot find documents without a loaded case/
		);
		assert.equal(service.db.documentSet.findFirst.mock.callCount(), 0);
	});
});

describe('saveDocumentsOverride', () => {
	const saveDocumentsOverride = (
		service: ReturnType<typeof createMockService>,
		{
			request = buildRequest(),
			uploadedFiles,
			existingDocuments = [],
			isTemp = true
		}: {
			request?: Request;
			uploadedFiles: UploadedFile[];
			existingDocuments?: unknown[];
			isTemp?: boolean;
		}
	) =>
		DocumentUtil.saveDocumentsOverride({
			service: service as unknown as Service,
			request,
			documentSetFolderName: TEST_DOCUMENT_SET_FOLDER_NAME,
			temporaryUploadedFiles: uploadedFiles,
			existingDocuments: asDocumentRows(existingDocuments),
			isTemp
		});

	it('creates documents only for uploaded files that are not already stored', async () => {
		const transactionClient = createTransactionClient();
		const service = createMockService({ tx: transactionClient });
		const storedFile = buildUploadedFile({ id: 'gateway-2/stored.pdf', path: 'gateway-2/stored.pdf' });
		const newFile = buildUploadedFile({ id: 'gateway-2/new.pdf', path: 'gateway-2/new.pdf', fileName: 'new.pdf' });
		const storedDocument = buildDocumentRow({ guid: 'document-1', name: 'gateway-2/stored.pdf' });

		await saveDocumentsOverride(service, {
			uploadedFiles: [storedFile, newFile],
			existingDocuments: [storedDocument]
		});

		assert.equal(transactionClient.document.create.mock.callCount(), 1);
		const createdDocumentData = transactionClient.document.create.mock.calls[0].arguments[0].data;
		assert.equal(createdDocumentData.name, 'gateway-2/new.pdf');
		assert.equal(createdDocumentData.caseId, 'case-1');
		assert.equal(createdDocumentData.documentSetId, COVER_LETTER_DOCUMENT_SET_ID);
	});

	for (const isTemp of [true, false]) {
		it(`creates documents with isTemp set to ${isTemp}`, async () => {
			const transactionClient = createTransactionClient();
			const service = createMockService({ tx: transactionClient });

			await saveDocumentsOverride(service, { uploadedFiles: [buildUploadedFile()], isTemp });

			const createdDocumentData = transactionClient.document.create.mock.calls[0].arguments[0].data;
			assert.equal(createdDocumentData.isTemp, isTemp);
		});
	}

	it('creates a new document when the stored document with the same name is soft-deleted', async () => {
		const transactionClient = createTransactionClient();
		const service = createMockService({ tx: transactionClient });
		const deletedDocument = buildDocumentRow({
			guid: 'document-1',
			name: 'gateway-2/cover-letter.pdf',
			isDeleted: true
		});

		await saveDocumentsOverride(service, {
			uploadedFiles: [buildUploadedFile()],
			existingDocuments: [deletedDocument]
		});

		assert.equal(transactionClient.document.create.mock.callCount(), 1);
	});

	it('does not create documents when every uploaded file is already stored', async () => {
		const transactionClient = createTransactionClient();
		const service = createMockService({ tx: transactionClient });

		await saveDocumentsOverride(service, {
			uploadedFiles: [buildUploadedFile()],
			existingDocuments: [buildDocumentRow({ name: 'gateway-2/cover-letter.pdf' })]
		});

		assert.equal(transactionClient.document.create.mock.callCount(), 0);
		assert.equal(transactionClient.documentVersion.create.mock.callCount(), 0);
	});

	it('rejects when the document set reference data is missing', async () => {
		const service = createMockService({ documentSet: null });

		await assert.rejects(
			() => saveDocumentsOverride(service, { uploadedFiles: [buildUploadedFile()] }),
			/Missing document set reference data for "covering-letter"/
		);
		assert.equal(service.db.$transaction.mock.callCount(), 0);
	});

	it('requires a loaded case on the request', async () => {
		const service = createMockService();

		await assert.rejects(
			() => saveDocumentsOverride(service, { request: {} as Request, uploadedFiles: [buildUploadedFile()] }),
			/Cannot save documents without a loaded case/
		);
		assert.equal(service.db.documentSet.findFirst.mock.callCount(), 0);
		assert.equal(service.db.$transaction.mock.callCount(), 0);
	});
});

describe('restoreDocuments', () => {
	const restoreDocuments = (
		service: ReturnType<typeof createMockService>,
		uploadedFiles: UploadedFile[],
		existingDocuments: unknown[]
	) =>
		DocumentUtil.restoreDocuments({
			service: service as unknown as Service,
			temporaryUploadedFiles: uploadedFiles,
			existingDocuments: asDocumentRows(existingDocuments)
		});

	it('restores a soft-deleted document that is still in the upload list', async () => {
		const transactionClient = createTransactionClient();
		const service = createMockService({ tx: transactionClient });
		const deletedDocument = buildDocumentRow({
			guid: 'document-1',
			isDeleted: true,
			latestDocumentVersion: { ...buildDocumentRow().latestDocumentVersion, version: 2, isDeleted: true }
		});

		await restoreDocuments(service, [buildUploadedFile({ id: deletedDocument.name })], [deletedDocument]);

		assert.deepEqual(transactionClient.document.update.mock.calls[0].arguments[0], {
			where: {
				guid: 'document-1'
			},
			data: {
				isDeleted: false
			}
		});
		assert.deepEqual(transactionClient.documentVersion.update.mock.calls[0].arguments[0], {
			where: {
				documentGuid_version: {
					documentGuid: 'document-1',
					version: 2
				}
			},
			data: {
				isDeleted: false
			}
		});
	});

	it('restores a document whose latest version alone is soft-deleted', async () => {
		const transactionClient = createTransactionClient();
		const service = createMockService({ tx: transactionClient });
		const documentWithDeletedVersion = buildDocumentRow({
			guid: 'document-1',
			isDeleted: false,
			latestDocumentVersion: { ...buildDocumentRow().latestDocumentVersion, isDeleted: true }
		});

		await restoreDocuments(
			service,
			[buildUploadedFile({ id: documentWithDeletedVersion.name })],
			[documentWithDeletedVersion]
		);

		assert.equal(service.db.$transaction.mock.callCount(), 1);
		assert.deepEqual(transactionClient.documentVersion.update.mock.calls[0].arguments[0], {
			where: {
				documentGuid_version: {
					documentGuid: 'document-1',
					version: 1
				}
			},
			data: {
				isDeleted: false
			}
		});
	});

	it('restores each document in its own transaction', async () => {
		const transactionClient = createTransactionClient();
		const service = createMockService({ tx: transactionClient });
		const firstDeletedDocument = buildDocumentRow({ guid: 'document-1', name: 'gateway-2/first.pdf', isDeleted: true });
		const secondDeletedDocument = buildDocumentRow({
			guid: 'document-2',
			name: 'gateway-2/second.pdf',
			isDeleted: true
		});

		await restoreDocuments(
			service,
			[buildUploadedFile({ id: firstDeletedDocument.name }), buildUploadedFile({ id: secondDeletedDocument.name })],
			[firstDeletedDocument, secondDeletedDocument]
		);

		assert.equal(service.db.$transaction.mock.callCount(), 2);
		const restoredDocumentGuids = transactionClient.document.update.mock.calls.map(
			(updateCall) => updateCall.arguments[0].where.guid
		);
		assert.deepEqual(restoredDocumentGuids, ['document-1', 'document-2']);
	});

	it('does not restore soft-deleted documents that are not in the upload list', async () => {
		const service = createMockService();
		const deletedDocument = buildDocumentRow({ guid: 'document-1', isDeleted: true });

		await restoreDocuments(service, [buildUploadedFile({ id: 'gateway-2/other.pdf' })], [deletedDocument]);

		assert.equal(service.db.$transaction.mock.callCount(), 0);
	});

	it('leaves active documents untouched', async () => {
		const service = createMockService();
		const activeDocument = buildDocumentRow({ guid: 'document-1' });

		await restoreDocuments(service, [buildUploadedFile({ id: activeDocument.name })], [activeDocument]);

		assert.equal(service.db.$transaction.mock.callCount(), 0);
	});
});

describe('deleteDocuments', () => {
	const deleteDocuments = (
		service: ReturnType<typeof createMockService>,
		uploadedFiles: UploadedFile[],
		existingDocuments: unknown[]
	) =>
		DocumentUtil.deleteDocuments({
			service: service as unknown as Service,
			temporaryUploadedFiles: uploadedFiles,
			existingDocuments: asDocumentRows(existingDocuments)
		});

	it('soft-deletes documents that are no longer in the upload list', async () => {
		const transactionClient = createTransactionClient();
		const service = createMockService({ tx: transactionClient });
		const keptDocument = buildDocumentRow({ guid: 'document-1', name: 'gateway-2/kept.pdf' });
		const removedDocument = buildDocumentRow({ guid: 'document-2', name: 'gateway-2/removed.pdf' });

		await deleteDocuments(service, [buildUploadedFile({ id: keptDocument.name })], [keptDocument, removedDocument]);

		assert.equal(transactionClient.document.update.mock.callCount(), 1);
		assert.deepEqual(transactionClient.document.update.mock.calls[0].arguments[0], {
			where: {
				guid: 'document-2'
			},
			data: {
				isDeleted: true
			}
		});
		assert.deepEqual(transactionClient.documentVersion.updateMany.mock.calls[0].arguments[0], {
			where: {
				documentGuid: 'document-2'
			},
			data: {
				isDeleted: true
			}
		});
	});

	it('soft-deletes every removed document in a single transaction', async () => {
		const transactionClient = createTransactionClient();
		const service = createMockService({ tx: transactionClient });
		const firstRemovedDocument = buildDocumentRow({ guid: 'document-1' });
		const secondRemovedDocument = buildDocumentRow({ guid: 'document-2' });

		await deleteDocuments(service, [], [firstRemovedDocument, secondRemovedDocument]);

		assert.equal(service.db.$transaction.mock.callCount(), 1);
		const deletedDocumentGuids = transactionClient.document.update.mock.calls.map(
			(updateCall) => updateCall.arguments[0].where.guid
		);
		assert.deepEqual(deletedDocumentGuids, ['document-1', 'document-2']);
	});

	it('skips documents that are already fully soft-deleted', async () => {
		const transactionClient = createTransactionClient();
		const service = createMockService({ tx: transactionClient });
		const fullyDeletedDocument = buildDocumentRow({
			guid: 'document-1',
			isDeleted: true,
			latestDocumentVersion: { ...buildDocumentRow().latestDocumentVersion, isDeleted: true }
		});

		await deleteDocuments(service, [], [fullyDeletedDocument]);

		assert.equal(transactionClient.document.update.mock.callCount(), 0);
		assert.equal(transactionClient.documentVersion.updateMany.mock.callCount(), 0);
	});

	it('soft-deletes the versions of a deleted document whose latest version is still active', async () => {
		const transactionClient = createTransactionClient();
		const service = createMockService({ tx: transactionClient });
		const partiallyDeletedDocument = buildDocumentRow({ guid: 'document-1', isDeleted: true });

		await deleteDocuments(service, [], [partiallyDeletedDocument]);

		assert.deepEqual(transactionClient.documentVersion.updateMany.mock.calls[0].arguments[0], {
			where: {
				documentGuid: 'document-1'
			},
			data: {
				isDeleted: true
			}
		});
	});

	it('does not delete anything when every existing document is still uploaded', async () => {
		const transactionClient = createTransactionClient();
		const service = createMockService({ tx: transactionClient });
		const firstDocument = buildDocumentRow({ guid: 'document-1', name: 'gateway-2/first.pdf' });
		const secondDocument = buildDocumentRow({ guid: 'document-2', name: 'gateway-2/second.pdf' });

		await deleteDocuments(
			service,
			[buildUploadedFile({ id: firstDocument.name }), buildUploadedFile({ id: secondDocument.name })],
			[firstDocument, secondDocument]
		);

		assert.equal(transactionClient.document.update.mock.callCount(), 0);
		assert.equal(transactionClient.documentVersion.updateMany.mock.callCount(), 0);
	});
});

describe('loadTempUploadedDocuments', () => {
	it('loads temporary documents as uploaded files', async () => {
		const temporaryDocument = buildDocumentRow({ guid: 'document-1', isTemp: true });
		const service = createMockService({ existingDocuments: [temporaryDocument] });

		const temporaryFiles = await DocumentUtil.loadTempUploadedDocuments(
			service as unknown as Service,
			'case-1',
			COVER_LETTER_DOCUMENT_SET_ID
		);

		assert.deepEqual(temporaryFiles, [
			{
				id: temporaryDocument.name,
				fileName: 'cover-letter.pdf',
				mimeType: 'application/pdf',
				size: 100,
				storageProvider: 'blob',
				containerName: 'local-planning-documents',
				virusCheckStatus: 'scanned',
				path: 'gateway-2/cover-letter.pdf',
				url: 'http://storage/cover-letter.pdf',
				dateCreated: DOCUMENT_CREATED_DATE,
				isTemp: true,
				metadata: {
					documentGuid: 'document-1',
					documentSetId: COVER_LETTER_DOCUMENT_SET_ID,
					version: 1
				}
			}
		]);
	});

	it('queries only active temporary documents in creation order', async () => {
		const service = createMockService({ existingDocuments: [] });

		await DocumentUtil.loadTempUploadedDocuments(service as unknown as Service, 'case-1', COVER_LETTER_DOCUMENT_SET_ID);

		assert.deepEqual(service.db.document.findMany.mock.calls[0].arguments[0], {
			where: {
				caseId: 'case-1',
				documentSetId: COVER_LETTER_DOCUMENT_SET_ID,
				AND: [{ isDeleted: false }, { isTemp: true }]
			},
			include: {
				latestDocumentVersion: true
			},
			orderBy: {
				createdAt: 'asc'
			}
		});
	});

	it('skips temporary documents without a latest document version', async () => {
		const documentWithVersion = buildDocumentRow({ guid: 'document-1', isTemp: true });
		const documentWithoutVersion = buildDocumentRow({ guid: 'document-2', isTemp: true, latestDocumentVersion: null });
		const service = createMockService({ existingDocuments: [documentWithVersion, documentWithoutVersion] });

		const temporaryFiles = await DocumentUtil.loadTempUploadedDocuments(
			service as unknown as Service,
			'case-1',
			COVER_LETTER_DOCUMENT_SET_ID
		);

		assert.deepEqual(
			temporaryFiles.map((temporaryFile) => temporaryFile.id),
			[documentWithVersion.name]
		);
	});
});

describe('cleanUpTempDocuments', () => {
	it('soft-deletes every temporary document in the document set, each in its own transaction', async () => {
		const transactionClient = createTransactionClient();
		const service = createMockService({
			tx: transactionClient,
			existingDocuments: [
				buildDocumentRow({ guid: 'document-1', isTemp: true }),
				buildDocumentRow({ guid: 'document-2', isTemp: true })
			]
		});

		await DocumentUtil.cleanUpTempDocuments(service as unknown as Service, 'case-1', TEST_DOCUMENT_SET_FOLDER_NAME);

		assert.equal(service.db.documentSet.findFirst.mock.callCount(), 1);
		assert.equal(
			service.db.document.findMany.mock.calls[0].arguments[0].where.documentSetId,
			COVER_LETTER_DOCUMENT_SET_ID
		);
		assert.equal(service.db.$transaction.mock.callCount(), 2);
		assert.deepEqual(
			transactionClient.document.update.mock.calls.map((updateCall) => updateCall.arguments[0]),
			[
				{ where: { guid: 'document-1' }, data: { isDeleted: true } },
				{ where: { guid: 'document-2' }, data: { isDeleted: true } }
			]
		);
		assert.deepEqual(
			transactionClient.documentVersion.updateMany.mock.calls.map((updateCall) => updateCall.arguments[0]),
			[
				{ where: { documentGuid: 'document-1' }, data: { isDeleted: true } },
				{ where: { documentGuid: 'document-2' }, data: { isDeleted: true } }
			]
		);
	});

	it('does nothing when there are no temporary documents', async () => {
		const service = createMockService({ existingDocuments: [] });

		await DocumentUtil.cleanUpTempDocuments(service as unknown as Service, 'case-1', TEST_DOCUMENT_SET_FOLDER_NAME);

		assert.equal(service.db.$transaction.mock.callCount(), 0);
	});

	it('rejects when the document set reference data is missing', async () => {
		const service = createMockService({ documentSet: null });

		await assert.rejects(
			() => DocumentUtil.cleanUpTempDocuments(service as unknown as Service, 'case-1', TEST_DOCUMENT_SET_FOLDER_NAME),
			/Missing document set reference data for "covering-letter"/
		);
		assert.equal(service.db.document.findMany.mock.callCount(), 0);
	});
});
