import type { Request } from 'express';
import type { PortalService } from '#service';
import type { UploadedFile } from '@pins/local-plans-lib/forms/custom-components/file-uploader/index.ts';
import { DocumentUtil } from '@pins/local-plans-lib/util/documents.ts';

export async function loadGateway3DocumentsByDocumentSetId(
	service: PortalService,
	caseId: string,
	documentSetId: string
): Promise<UploadedFile[]> {
	return DocumentUtil.loadUploadedDocuments(service, caseId, documentSetId);
}

export async function saveGateway3Documents(
	service: PortalService,
	req: Request,
	documentSetFolderName: string,
	uploadedFiles: UploadedFile[]
): Promise<void> {
	return DocumentUtil.saveDocuments(service, req, documentSetFolderName, uploadedFiles);
}

export async function getDocumentSetIdsByFolderName(
	service: PortalService,
	documentSetFolderNames: string[]
): Promise<Map<string, string>> {
	return DocumentUtil.getDocumentSetIdsByFolderName(service, documentSetFolderNames);
}
