import type { PortalService } from '#service';
import { type IRouter, Router as createRouter } from 'express';
import {
	buildGateway2CheckAnswersList,
	buildGateway2Middleware,
	buildSubmittedGateway2View,
	handleMulterFileSizeError,
	setAsEditingFromCya,
	setGateway2CheckAnswersViewData
} from './controller.ts';
import { createApplicationCompleteRoutes } from './application-complete/index.ts';
import { createApplicationDeclarationRoutes } from './application-declaration/index.ts';

export function gateway2SubmissionRoutes(service: PortalService): IRouter {
	const router = createRouter({ mergeParams: true });
	const {
		getJourneyResponse,
		getJourney,
		getJourneyResponseFromCase,
		saveToDatabase,
		upload,
		uploadGateway2Document,
		uploadGateway2DocumentForCase,
		deleteGateway2Document,
		deleteGateway2DocumentForCase,
		fileUploaderMiddleware,
		fileUploaderMiddlewareForCase,
		downloadGateway2Document,
		validate,
		validationErrorHandler,
		validateGateway2Submission,
		question,
		lusca,
		redirectAfterCaseQuestionEdit,
		redirectAfterCyaEdit
	} = buildGateway2Middleware(service);

	router.get(
		'/gateway-2-submission',
		getJourneyResponse,
		getJourney,
		setAsEditingFromCya,
		setGateway2CheckAnswersViewData,
		buildGateway2CheckAnswersList()
	);

	router.post('/gateway-2-submission', getJourneyResponse, getJourney, validateGateway2Submission, saveToDatabase);

	router.use(
		'/:planReference/gateway-2-submission/application-declaration',
		createApplicationDeclarationRoutes(service)
	);

	router.use('/:planReference/gateway-2-submission/application-complete', createApplicationCompleteRoutes());

	router.get(
		'/:planReference/gateway-2-submission',
		getJourneyResponseFromCase,
		getJourney,
		setAsEditingFromCya,
		setGateway2CheckAnswersViewData,
		buildSubmittedGateway2View(),
		buildGateway2CheckAnswersList()
	);

	router.post(
		'/:planReference/gateway-2-submission',
		getJourneyResponseFromCase,
		getJourney,
		validateGateway2Submission,
		saveToDatabase
	);

	router.post(
		'/:planReference/gateway-2-submission/:section/:question/upload-documents',
		getJourneyResponseFromCase,
		getJourney,
		upload.array('files[]'),
		// Lusca CSRF check performed after Multer handles the multipart/form-data
		lusca.csrf(),
		uploadGateway2DocumentForCase,
		handleMulterFileSizeError
	);

	router.post(
		'/:planReference/gateway-2-submission/:section/:question/delete-document/:fileId',
		getJourneyResponseFromCase,
		getJourney,
		deleteGateway2DocumentForCase
	);

	router.post(
		'/gateway-2-submission/:section/:question/upload-documents',
		getJourneyResponse,
		getJourney,
		upload.array('files[]'),
		// Lusca CSRF check performed after Multer handles the multipart/form-data
		lusca.csrf(),
		uploadGateway2Document,
		handleMulterFileSizeError
	);

	router.post(
		'/gateway-2-submission/:section/:question/delete-document/:fileId',
		getJourneyResponse,
		getJourney,
		deleteGateway2Document
	);

	router.get(
		'/:planReference/gateway-2-submission/download-document/:documentId',
		getJourneyResponseFromCase,
		downloadGateway2Document
	);

	router.get(
		'/:planReference/gateway-2-submission/:section/:question{/:manageListAction/:manageListItemId/:manageListQuestion}',
		getJourneyResponseFromCase,
		getJourney,
		fileUploaderMiddlewareForCase,
		question
	);

	router.post(
		'/:planReference/gateway-2-submission/:section/:question{/:manageListAction/:manageListItemId/:manageListQuestion}',
		getJourneyResponseFromCase,
		getJourney,
		validate,
		validationErrorHandler,
		redirectAfterCaseQuestionEdit
	);

	router.get(
		'/gateway-2-submission/:section/:question{/:manageListAction/:manageListItemId/:manageListQuestion}',
		getJourneyResponse,
		getJourney,
		fileUploaderMiddleware,
		question
	);

	router.post(
		'/gateway-2-submission/:section/:question{/:manageListAction/:manageListItemId/:manageListQuestion}',
		getJourneyResponse,
		getJourney,
		validate,
		validationErrorHandler,
		redirectAfterCyaEdit
	);

	return router;
}
