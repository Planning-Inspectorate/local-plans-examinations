import { randomUUID } from 'node:crypto';
import type { Request } from 'express';
import type { PortalService } from '#service';
import { DOCUMENT_SET_ID } from '@pins/local-plans-database/src/seed/static-data/ids/index.ts';
import type { UploadedFile } from '@pins/local-plans-lib/forms/custom-components/file-uploader/index.ts';

export const GATEWAY_2_COVER_LETTER_DOCUMENT_SET_ID = DOCUMENT_SET_ID.G2_COVER_LETTER;

type RequestWithCurrentCase = Request & {
	currentCase?: {
		id?: string;
	};
};

type DocumentVersionRow = {
	version: number;
	originalFilename: string | null;
	fileName: string | null;
	mime: string | null;
	size: number | null;
	blobStorageContainer: string | null;
	blobStoragePath: string | null;
	documentURI: string | null;
	isDeleted: boolean;
};

type DocumentRow = {
	guid: string;
	name: string;
	documentSetId: string;
	isDeleted: boolean;
	latestDocumentVersion: DocumentVersionRow | null;
};

type SyncGateway2CoverLetterDocumentsParams = {
	caseId: string;
	documentSetId: string;
	uploadedFiles: UploadedFile[];
};

// Loads the saved cover letter files for this case.
export async function loadGateway2CoverLetterDocuments(
	service: PortalService,
	caseId: string
): Promise<UploadedFile[]> {
	return loadUploadedDocuments(service, caseId, GATEWAY_2_COVER_LETTER_DOCUMENT_SET_ID);
}

// Saves the current cover letter upload state.
export async function saveGateway2CoverLetterDocuments(
	service: PortalService,
	req: Request,
	uploadedFiles: UploadedFile[]
): Promise<void> {
	const caseId = (req as RequestWithCurrentCase).currentCase?.id;
	if (!caseId) {
		throw new Error('Cannot save Gateway 2 cover letter documents without a loaded case');
	}

	await syncGateway2CoverLetterDocuments(service, {
		caseId,
		documentSetId: GATEWAY_2_COVER_LETTER_DOCUMENT_SET_ID,
		uploadedFiles
	});
}

// Reads active documents from the database.
async function loadUploadedDocuments(
	service: PortalService,
	caseId: string,
	documentSetId: string
): Promise<UploadedFile[]> {
	const documents = (await service.db.document.findMany({
		where: {
			caseId,
			documentSetId,
			isDeleted: false
		},
		include: {
			latestDocumentVersion: true
		},
		orderBy: {
			createdAt: 'asc'
		}
	})) as DocumentRow[];

	return documents.map(mapDocumentToUploadedFile).filter((file): file is UploadedFile => Boolean(file));
}

// Makes the database match the uploaded file list.
async function syncGateway2CoverLetterDocuments(
	service: PortalService,
	{ caseId, documentSetId, uploadedFiles }: SyncGateway2CoverLetterDocumentsParams
): Promise<void> {
	if (uploadedFiles.length > 1) {
		throw new Error('Gateway 2 cover letter can only have one active uploaded document');
	}

	await assertDocumentSetExists(service, documentSetId);

	const existingDocuments = (await service.db.document.findMany({
		where: {
			caseId,
			documentSetId
		},
		include: {
			latestDocumentVersion: true
		}
	})) as DocumentRow[];

	const uploadedFileIds = new Set(uploadedFiles.map((file) => file.id));
	const existingDocumentsByFileId = new Map<string, DocumentRow>();
	for (const document of existingDocuments) {
		const fileId = getDocumentUploadedFileId(document);
		if (fileId) {
			existingDocumentsByFileId.set(fileId, document);
		}
	}

	await service.db.$transaction(async (tx) => {
		for (const document of existingDocuments) {
			const fileId = getDocumentUploadedFileId(document);
			if (fileId && uploadedFileIds.has(fileId)) {
				if (document.isDeleted || document.latestDocumentVersion?.isDeleted) {
					await restoreDocument(tx, document);
				}
				continue;
			}

			if (!document.isDeleted) {
				await softDeleteDocument(tx, document.guid);
			}
		}

		for (const file of uploadedFiles) {
			const existingDocument = existingDocumentsByFileId.get(file.id);
			if (existingDocument) {
				continue;
			}

			await createDocument(tx, { caseId, documentSetId, file });
		}
	});
}

// Converts a document row into the uploader shape.
function mapDocumentToUploadedFile(document: DocumentRow): UploadedFile | undefined {
	const version = document.latestDocumentVersion;
	if (!version || version.isDeleted) {
		return undefined;
	}

	const id = version.blobStoragePath ?? version.documentURI ?? document.name;

	return {
		id,
		fileName: version.originalFilename ?? version.fileName ?? document.name,
		mimeType: version.mime ?? 'application/octet-stream',
		size: version.size ?? 0,
		storageProvider: 'blob',
		containerName: version.blobStorageContainer ?? undefined,
		path: version.blobStoragePath ?? undefined,
		url: version.documentURI ?? undefined,
		metadata: {
			documentGuid: document.guid,
			documentSetId: document.documentSetId,
			version: version.version
		}
	};
}

// Gets the storage id used by the uploader.
function getDocumentUploadedFileId(document: DocumentRow): string | undefined {
	const version = document.latestDocumentVersion;
	return version?.blobStoragePath ?? version?.documentURI ?? document.name;
}

// Checks the reference data exists before saving.
async function assertDocumentSetExists(service: PortalService, documentSetId: string): Promise<void> {
	const documentSet = await service.db.documentSet.findUnique({
		where: {
			id: documentSetId
		}
	});

	if (!documentSet) {
		throw new Error(`Missing document set reference data for "${documentSetId}". Run the database static seed.`);
	}
}

// Creates the document and its first version.
async function createDocument(
	tx: TransactionClient,
	{ caseId, documentSetId, file }: { caseId: string; documentSetId: string; file: UploadedFile }
) {
	const guid = randomUUID();
	const version = 1;

	await tx.document.create({
		data: {
			guid,
			name: file.id,
			caseId,
			documentSetId
		}
	});

	await tx.documentVersion.create({
		data: {
			documentGuid: guid,
			version,
			originalFilename: file.fileName,
			fileName: file.fileName,
			mime: file.mimeType,
			size: file.size,
			blobStorageContainer: file.containerName,
			blobStoragePath: file.path ?? file.id,
			documentURI: file.url,
			sourceSystem: 'front-office',
			virusCheckStatus: 'not_scanned'
		}
	});

	await tx.document.update({
		where: {
			guid
		},
		data: {
			latestVersionId: version
		}
	});
}

// Marks a document and all versions as deleted.
async function softDeleteDocument(tx: TransactionClient, documentGuid: string) {
	await tx.document.update({
		where: {
			guid: documentGuid
		},
		data: {
			isDeleted: true
		}
	});

	await tx.documentVersion.updateMany({
		where: {
			documentGuid
		},
		data: {
			isDeleted: true
		}
	});
}

// Brings a previously deleted document back.
async function restoreDocument(tx: TransactionClient, document: DocumentRow) {
	await tx.document.update({
		where: {
			guid: document.guid
		},
		data: {
			isDeleted: false
		}
	});

	if (!document.latestDocumentVersion) {
		return;
	}

	await tx.documentVersion.update({
		where: {
			documentGuid_version: {
				documentGuid: document.guid,
				version: document.latestDocumentVersion.version
			}
		},
		data: {
			isDeleted: false
		}
	});
}

type TransactionClient = Omit<
	PortalService['db'],
	'$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;
