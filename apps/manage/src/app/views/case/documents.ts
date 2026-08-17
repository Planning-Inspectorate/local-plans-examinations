import { randomUUID } from 'node:crypto';
import type { Request } from 'express';
import type { ManageService } from '#service';
import type { UploadedFile } from '@pins/local-plans-lib/forms/custom-components/file-uploader/index.ts';

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

type SyncDocumentsParams = {
	caseId: string;
	documentSetId: string;
	uploadedFiles: UploadedFile[];
};

type DocumentSetRow = {
	id: string;
	folderName: string;
};

/**
 * Saves the current upload state.
 * @param service The manage service
 * @param req The request object
 * @param documentSetFolderName The document set folder name
 * @param uploadedFiles An array of uploaded files
 */
export async function saveDocuments(
	service: ManageService,
	req: Request,
	documentSetFolderName: string,
	uploadedFiles: UploadedFile[]
): Promise<void> {
	console.log('attemping to save document');
	const caseId = (req as RequestWithCurrentCase).currentCase?.id;
	if (!caseId) {
		throw new Error('Cannot save documents without a loaded case');
	}

	const documentSetId = await getDocumentSetIdByFolderName(service, documentSetFolderName);

	await syncDocuments(service, {
		caseId,
		documentSetId,
		uploadedFiles
	});
}

/**
 * Reads active documents from the database.
 * @param service The manage service
 * @param caseId The case to load the documents for
 * @param documentSetId The specific document set to load
 * @returns An array of uploaded file details
 */
export async function loadUploadedDocuments(
	service: ManageService,
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

/**
 * Makes the database match the uploaded file list
 * @param service The manage service
 * @param param1 An object that holds the case id, documentSet id and an array of uploaded files
 */
async function syncDocuments(
	service: ManageService,
	{ caseId, documentSetId, uploadedFiles }: SyncDocumentsParams
): Promise<void> {
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

/**
 * Converts document details into a structure that the FileUpload component accepts
 * @param document An answer that holds documenr details
 * @returns Reformatted answer details into a structure that the FileUpload component accepts
 */
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

/**
 * Gets the storage id used by the uploader.
 * @param document The document details
 * @returns The storage id of the document's storage location
 */
function getDocumentUploadedFileId(document: DocumentRow): string | undefined {
	const version = document.latestDocumentVersion;
	return version?.blobStoragePath ?? version?.documentURI ?? document.name;
}

/**
 * Finds document set reference data for all configured question URLs/folder names.
 * @param service The manage service
 * @param documentSetFolderNames Array of folder names to load
 * @returns
 */
export async function getDocumentSetIdsByFolderName(
	service: ManageService,
	documentSetFolderNames: string[]
): Promise<Map<string, string>> {
	const uniqueFolderNames = [...new Set(documentSetFolderNames)];
	const documentSets = (await service.db.documentSet.findMany({
		where: {
			folderName: {
				in: uniqueFolderNames
			}
		},
		select: {
			id: true,
			folderName: true
		}
	})) as DocumentSetRow[];

	const documentSetIdsByFolderName = new Map(
		documentSets.map((documentSet) => [documentSet.folderName, documentSet.id])
	);

	for (const folderName of uniqueFolderNames) {
		if (!documentSetIdsByFolderName.has(folderName)) {
			throw new Error(`Missing document set reference data for "${folderName}". Run the database static seed.`);
		}
	}

	return documentSetIdsByFolderName;
}

/**
 * Finds the document set reference data from the question URL/folder name.
 * @param service The manage service
 * @param documentSetFolderName The name of the document set folder to load
 * @returns The document set's id
 */
async function getDocumentSetIdByFolderName(service: ManageService, documentSetFolderName: string): Promise<string> {
	const documentSet = await service.db.documentSet.findFirst({
		where: {
			folderName: documentSetFolderName
		},
		select: {
			id: true
		}
	});

	if (!documentSet) {
		throw new Error(
			`Missing document set reference data for "${documentSetFolderName}". Run the database static seed.`
		);
	}

	return documentSet.id;
}

/**
 * Creates the document and its first version.
 * @param tx A database transaction client
 * @param param1 An object of case id, documentSet id and the uploaded file details
 */
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

/**
 * Marks a document and all versions as deleted.
 * @param tx A database transaction client
 * @param documentGuid The guid of the document to soft delete
 */
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

/**
 * Brings a previously deleted document back.
 * @param tx A database transaction client
 * @param document The document details
 */
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
	ManageService['db'],
	'$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;
