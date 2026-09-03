import type { RequestHandler } from 'express';
import { DocumentUtil } from '@pins/local-plans-lib/util/documents.ts';
import type { PortalService } from '#service';

export function downloadGateway2Document(service: PortalService): RequestHandler {
	return async (req, res) => {
		const { documentId } = req.params;
		if (!documentId || typeof documentId !== 'string') {
			throw new Error('Missing documentId for download');
		}
		if (!documentId) {
			throw new Error('Missing documentId for download');
		}
		await DocumentUtil.downloadDocumentToResponse(service, documentId, res);
	};
}
