import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';
import type { BaseService } from '@pins/local-plans-lib/app/base-service.ts';
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
	dateCreated: Date | null;
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

// Saves the current upload state.
export async function saveDocuments(
	service: BaseService,
	req: Request,
	documentSetFolderName: string,
	uploadedFiles: UploadedFile[]
): Promise<void> {
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

// Reads active documents from the database.
export async function loadUploadedDocuments(
	service: BaseService,
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

export async function getLatestDocumentBlobDetails(service: BaseService, documentId: string) {
	const latestDocument = await service.db.document.findFirst({
		select: {
			latestDocumentVersion: {
				select: {
					blobStorageContainer: true,
					blobStoragePath: true,
					fileName: true
				}
			}
		},
		where: {
			guid: documentId,
			isDeleted: false
		}
	});
	if (!latestDocument || !latestDocument.latestDocumentVersion) {
		throw new Error(`Could not find an active document version for '${documentId}'`);
	}
	const containerName = latestDocument.latestDocumentVersion.blobStorageContainer;
	const blobPath = latestDocument.latestDocumentVersion.blobStoragePath;
	const fileName = latestDocument.latestDocumentVersion.fileName;
	if (!containerName) {
		throw new Error(`blobStorageContainer is null for the latest version of document '${documentId}'`);
	}
	if (!blobPath) {
		throw new Error(`blobStoragePath is null for the latest version of document '${documentId}'`);
	}
	if (!fileName) {
		throw new Error(`fileName is null for the latest version of document '${documentId}'`);
	}
	return {
		containerName: containerName,
		blobPath: blobPath,
		fileName: fileName
	};
}

// Makes the database match the uploaded file list.
async function syncDocuments(
	service: BaseService,
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

// Converts a document row into the uploader shape.
function mapDocumentToUploadedFile(document: DocumentRow): UploadedFile | undefined {
	const version = document.latestDocumentVersion;
	if (!version || version.isDeleted) {
		return undefined;
	}

	return {
		id: document.guid,
		fileName: version.originalFilename ?? version.fileName ?? document.name,
		mimeType: version.mime ?? 'application/octet-stream',
		size: version.size ?? 0,
		storageProvider: 'blob',
		containerName: version.blobStorageContainer ?? undefined,
		path: version.blobStoragePath ?? undefined,
		url: version.documentURI ?? undefined,
		dateCreated: version.dateCreated ?? undefined,
		metadata: {
			documentGuid: document.guid,
			documentSetId: document.documentSetId,
			version: version.version
		}
	};
}

// Gets the route-safe id used by the uploader.
function getDocumentUploadedFileId(document: DocumentRow): string | undefined {
	return document.guid;
}

// Finds document set reference data for all configured question URLs/folder names.
export async function getDocumentSetIdsByFolderName(
	service: BaseService,
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

// Finds the document set reference data from the question URL/folder name.
async function getDocumentSetIdByFolderName(service: BaseService, documentSetFolderName: string): Promise<string> {
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

export async function downloadDocumentToResponse(service: BaseService, documentId: string, res: Response) {
	if (!documentId) {
		throw Error(`Missing a documentId`);
	}
	const blobDetails = await getLatestDocumentBlobDetails(service, documentId);
	const blobPath = blobDetails.blobPath;
	const fileName = blobDetails.fileName;
	const blobStorageUtil = service.createFileStorage(blobPath);
	await blobStorageUtil.downloadToExpressResponse(blobPath, fileName, res);
}

type TransactionClient = Omit<
	BaseService['db'],
	'$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;
