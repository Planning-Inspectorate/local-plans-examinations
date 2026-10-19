import type { PortalService } from '#service';
import { type IRouter, Router as createRouter } from 'express';
import {
	buildExaminationCheckAnswersList,
	buildExaminationMiddleware,
	handleMulterFileSizeError,
	setAsEditingFromCheckAnswers,
	setExaminationViewData
} from './controller.ts';

export function examinationSubmissionRoutes(service: PortalService): IRouter {
	const router = createRouter({ mergeParams: true });
	const {
		getJourneyResponseFromCase,
		getJourney,
		upload,
		uploadDocumentForCase,
		deleteDocumentForCase,
		fileUploaderMiddlewareForCase,
		downloadDocument,
		validate,
		validationErrorHandler,
		question,
		lusca,
		redirectAfterQuestionEdit,
		validateExaminationSubmission
	} = buildExaminationMiddleware(service);

	router.get(
		'/:planReference/examination-submission',
		getJourneyResponseFromCase,
		getJourney,
		setAsEditingFromCheckAnswers,
		setExaminationViewData,
		buildExaminationCheckAnswersList()
	);

	router.post(
		'/:planReference/examination-submission',
		getJourneyResponseFromCase,
		getJourney,
		validateExaminationSubmission,
		(req, res) => {
			const planReference = encodeURIComponent(req.params.planReference as string);
			res.redirect(`/manage-local-plans/${planReference}/examination-submission/declaration`);
		}
	);

	router.post(
		'/:planReference/examination-submission/:section/:question/upload-documents',
		getJourneyResponseFromCase,
		getJourney,
		upload.array('files[]'),
		lusca.csrf(),
		uploadDocumentForCase,
		handleMulterFileSizeError
	);

	router.post(
		'/:planReference/examination-submission/:section/:question/delete-document/:fileId',
		getJourneyResponseFromCase,
		getJourney,
		deleteDocumentForCase
	);

	router.get(
		'/:planReference/examination-submission/download-document/:documentId',
		getJourneyResponseFromCase,
		downloadDocument
	);

	router.get(
		'/:planReference/examination-submission/:section/:question{/:manageListAction/:manageListItemId/:manageListQuestion}',
		getJourneyResponseFromCase,
		getJourney,
		fileUploaderMiddlewareForCase,
		question
	);

	router.post(
		'/:planReference/examination-submission/:section/:question{/:manageListAction/:manageListItemId/:manageListQuestion}',
		getJourneyResponseFromCase,
		getJourney,
		validate,
		validationErrorHandler,
		redirectAfterQuestionEdit
	);

	return router;
}
