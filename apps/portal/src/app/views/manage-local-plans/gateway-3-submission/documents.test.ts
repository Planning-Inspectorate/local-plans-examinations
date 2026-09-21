import assert from 'node:assert/strict';
import type { Request } from 'express';
import { describe, it, mock } from 'node:test';
import type { PortalService } from '#service';
import {
	DOCUMENT_SET_FOLDER_NAME,
	DOCUMENT_SET_ID
} from '@pins/local-plans-database/src/seed/static-data/ids/index.ts';
import type { UploadedFile } from '@pins/local-plans-lib/forms/custom-components/file-uploader/index.ts';
import {
	getDocumentSetIdsByFolderName,
	loadGateway3DocumentsByDocumentSetId,
	saveGateway3Documents
} from './documents.ts';

const G3_DOCUMENT_SET_ID = DOCUMENT_SET_ID.G3_PROPOSED_LOCAL_PLAN;
const TEST_DOCUMENT_SET_FOLDER_NAME = DOCUMENT_SET_FOLDER_NAME.G3_PROPOSED_LOCAL_PLAN;

describe('loadGateway3DocumentsByDocumentSetId', () => {
	it('delegates to DocumentUtil.loadUploadedDocuments', async () => {
		const service = createMockService({
			existingDocuments: [
				{
					guid: 'document-1',
					name: 'stored-file',
					documentSetId: G3_DOCUMENT_SET_ID,
					isDeleted: false,
					latestDocumentVersion: {
						version: 1,
						originalFilename: 'proposed-plan.pdf',
						fileName: 'stored-proposed-plan.pdf',
						mime: 'application/pdf',
						size: 456,
						blobStorageContainer: 'local-planning-documents',
						blobStoragePath: 'gateway-3/proposed-plan.pdf',
						dateCreated: null,
						documentURI: 'http://storage/proposed-plan.pdf',
						isDeleted: false
					}
				}
			]
		});

		const files = await loadGateway3DocumentsByDocumentSetId(
			service as unknown as PortalService,
			'case-1',
			G3_DOCUMENT_SET_ID
		);

		assert.equal(files.length, 1);
		assert.equal(files[0].fileName, 'proposed-plan.pdf');
		assert.equal(service.db.document.findMany.mock.callCount(), 1);
	});
});

describe('getDocumentSetIdsByFolderName', () => {
	it('delegates to DocumentUtil.getDocumentSetIdsByFolderName', async () => {
		const service = createMockService({
			documentSets: [
				{ id: G3_DOCUMENT_SET_ID, folderName: TEST_DOCUMENT_SET_FOLDER_NAME },
				{ id: 'g3-map-policies', folderName: 'map-of-policies' }
			]
		});

		const result = await getDocumentSetIdsByFolderName(service as unknown as PortalService, [
			TEST_DOCUMENT_SET_FOLDER_NAME,
			'map-of-policies'
		]);

		assert.equal(result.get(TEST_DOCUMENT_SET_FOLDER_NAME), G3_DOCUMENT_SET_ID);
		assert.equal(result.get('map-of-policies'), 'g3-map-policies');
	});

	it('rejects when any requested document set is missing', async () => {
		const service = createMockService({
			documentSets: [{ id: G3_DOCUMENT_SET_ID, folderName: TEST_DOCUMENT_SET_FOLDER_NAME }]
		});

		await assert.rejects(
			() =>
				getDocumentSetIdsByFolderName(service as unknown as PortalService, [
					TEST_DOCUMENT_SET_FOLDER_NAME,
					'map-of-policies'
				]),
			/Missing document set reference data for "map-of-policies"/
		);
	});
});

describe('saveGateway3Documents', () => {
	it('delegates to DocumentUtil.saveDocuments', async () => {
		const tx = createTransactionClient();
		const service = createMockService({ tx });
		const uploadedFile = buildUploadedFile();

		await saveGateway3Documents(service as unknown as PortalService, buildRequest(), TEST_DOCUMENT_SET_FOLDER_NAME, [
			uploadedFile
		]);

		assert.equal(service.db.documentSet.findFirst.mock.callCount(), 1);
		assert.equal(tx.document.create.mock.callCount(), 1);
	});

	it('requires a loaded case on the request', async () => {
		const service = createMockService();

		await assert.rejects(
			() =>
				saveGateway3Documents(service as unknown as PortalService, {} as Request, TEST_DOCUMENT_SET_FOLDER_NAME, [
					buildUploadedFile()
				]),
			/Cannot save documents without a loaded case/
		);
	});
});

function createMockService({
	documentSet = { id: G3_DOCUMENT_SET_ID },
	documentSets = [{ id: G3_DOCUMENT_SET_ID, folderName: TEST_DOCUMENT_SET_FOLDER_NAME }],
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
				findMany: mock.fn(async () => existingDocuments)
			},
			$transaction: mock.fn(async (callback: (client: ReturnType<typeof createTransactionClient>) => unknown) =>
				callback(tx)
			)
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
		id: 'gateway-3/proposed-plan.pdf',
		fileName: 'proposed-plan.pdf',
		mimeType: 'application/pdf',
		size: 200,
		storageProvider: 'blob',
		containerName: 'local-planning-documents',
		path: 'gateway-3/proposed-plan.pdf',
		url: 'http://storage/proposed-plan.pdf',
		...overrides
	};
}
