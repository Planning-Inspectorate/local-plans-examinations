import { randomUUID } from 'node:crypto';
import type { Request } from 'express';
import type { PortalService } from '#service';
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

type SyncGateway3DocumentsParams = {
	caseId: string;
	documentSetId: string;
	uploadedFiles: UploadedFile[];
};

type DocumentSetRow = {
	id: string;
	folderName: string;
};

export async function loadGateway3DocumentsByDocumentSetId(
	service: PortalService,
	caseId: string,
	documentSetId: string
): Promise<UploadedFile[]> {
	return loadUploadedDocuments(service, caseId, documentSetId);
}

export async function saveGateway3Documents(
	service: PortalService,
	req: Request,
	documentSetFolderName: string,
	uploadedFiles: UploadedFile[]
): Promise<void> {
	const caseId = (req as RequestWithCurrentCase).currentCase?.id;
	if (!caseId) {
		throw new Error('Cannot save Gateway 3 documents without a loaded case');
	}

	const documentSetId = await getDocumentSetIdByFolderName(service, documentSetFolderName);

	await syncGateway3Documents(service, {
		caseId,
		documentSetId,
		uploadedFiles
	});
}

export async function getDocumentSetIdsByFolderName(
	service: PortalService,
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

async function syncGateway3Documents(
	service: PortalService,
	{ caseId, documentSetId, uploadedFiles }: SyncGateway3DocumentsParams
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
		metadata: {
			documentGuid: document.guid,
			documentSetId: document.documentSetId,
			version: version.version
		}
	};
}

function getDocumentUploadedFileId(document: DocumentRow): string | undefined {
	return document.guid;
}

async function getDocumentSetIdByFolderName(service: PortalService, documentSetFolderName: string): Promise<string> {
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
			// eslint-disable-next-line camelcase
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
