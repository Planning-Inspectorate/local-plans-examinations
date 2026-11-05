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
		validateExaminationSubmission,
		guardExaminationAvailable,
		guardExaminationEdit,
		guardDeclarationPage,
		getDeclarationPage,
		postDeclarationPage,
		getSubmissionCompletePage,
		submittedExaminationView
	} = buildExaminationMiddleware(service);

	router.get(
		'/:planReference/examination',
		getJourneyResponseFromCase,
		guardExaminationAvailable,
		getJourney,
		setAsEditingFromCheckAnswers,
		setExaminationViewData,
		submittedExaminationView,
		buildExaminationCheckAnswersList()
	);

	router.post(
		'/:planReference/examination',
		getJourneyResponseFromCase,
		guardExaminationEdit,
		getJourney,
		validateExaminationSubmission,
		(req, res) => {
			const planReference = encodeURIComponent(req.params.planReference as string);
			res.redirect(`/manage-local-plans/${planReference}/examination/declaration`);
		}
	);

	router.get(
		'/:planReference/examination/declaration',
		getJourneyResponseFromCase,
		guardExaminationEdit,
		guardDeclarationPage,
		getDeclarationPage
	);

	router.post(
		'/:planReference/examination/declaration',
		getJourneyResponseFromCase,
		guardExaminationEdit,
		guardDeclarationPage,
		postDeclarationPage
	);

	router.get('/:planReference/examination/submission-complete', getSubmissionCompletePage);

	router.post(
		'/:planReference/examination/:section/:question/upload-documents',
		getJourneyResponseFromCase,
		guardExaminationEdit,
		getJourney,
		upload.array('files[]'),
		lusca.csrf(),
		uploadDocumentForCase,
		handleMulterFileSizeError
	);

	router.post(
		'/:planReference/examination/:section/:question/delete-document/:fileId',
		getJourneyResponseFromCase,
		guardExaminationEdit,
		getJourney,
		deleteDocumentForCase
	);

	router.get(
		'/:planReference/examination/download-document/:documentId',
		getJourneyResponseFromCase,
		guardExaminationAvailable,
		downloadDocument
	);

	router.get(
		'/:planReference/examination/:section/:question{/:manageListAction/:manageListItemId/:manageListQuestion}',
		getJourneyResponseFromCase,
		guardExaminationEdit,
		getJourney,
		fileUploaderMiddlewareForCase,
		question
	);

	router.post(
		'/:planReference/examination/:section/:question{/:manageListAction/:manageListItemId/:manageListQuestion}',
		getJourneyResponseFromCase,
		guardExaminationEdit,
		getJourney,
		validate,
		validationErrorHandler,
		redirectAfterQuestionEdit
	);

	return router;
}
