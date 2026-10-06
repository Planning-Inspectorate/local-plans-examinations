import type { PortalService } from '#service';
import { type IRouter, Router as createRouter } from 'express';
import { buildGateway3ResubmissionMiddleware, handleMulterFileSizeError } from './controller.ts';

export function gateway3ResubmissionRoutes(service: PortalService): IRouter {
	const router = createRouter({ mergeParams: true });

	const {
		loadCase,
		guardResubmission,
		getResubmissionPage,
		postResubmission,
		getUploadPage,
		postUploadPage,
		upload,
		uploadDocuments,
		deleteDocument,
		lusca
	} = buildGateway3ResubmissionMiddleware(service);

	// Resubmission landing page
	router.get('/:planReference/gateway-3-resubmission', loadCase, guardResubmission, getResubmissionPage);

	// Submit resubmission
	router.post('/:planReference/gateway-3-resubmission', loadCase, guardResubmission, postResubmission);

	// Upload documents page
	router.get('/:planReference/gateway-3-resubmission/additional-documents', loadCase, guardResubmission, getUploadPage);

	// Save and return from upload page
	router.post(
		'/:planReference/gateway-3-resubmission/additional-documents',
		loadCase,
		guardResubmission,
		postUploadPage
	);

	// Upload files
	router.post(
		'/:planReference/gateway-3-resubmission/additional-documents/upload-documents',
		loadCase,
		guardResubmission,
		upload.array('files[]'),
		lusca.csrf(),
		uploadDocuments,
		handleMulterFileSizeError
	);

	// Delete uploaded file
	router.post(
		'/:planReference/gateway-3-resubmission/additional-documents/delete-document/:fileId',
		loadCase,
		guardResubmission,
		deleteDocument
	);

	return router;
}
