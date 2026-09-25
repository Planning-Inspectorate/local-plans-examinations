import type { PortalService } from '#service';
import { type IRouter, Router as createRouter } from 'express';
import {
	buildGateway3CheckAnswersList,
	buildGateway3Middleware,
	handleMulterFileSizeError,
	setAsEditingFromCya,
	setGateway3ViewData
} from './controller.ts';

export function gateway3SubmissionRoutes(service: PortalService): IRouter {
	const router = createRouter({ mergeParams: true });

	// const getJourneyResponse = buildGetJourneyResponseFromSession(JOURNEY_ID);
	const {
		getJourney,
		getJourneyResponseFromCase,
		upload,
		uploadGateway3DocumentForCase,
		deleteGateway3DocumentForCase,
		fileUploaderMiddlewareForCase,
		downloadGateway3Document,
		validate,
		validationErrorHandler,
		question,
		lusca,
		redirectAfterCaseQuestionEdit
	} = buildGateway3Middleware(service);

	// router.get(
	// 	'/gateway-3-submission',
	// 	getJourneyResponse,
	// 	getJourney,
	// 	setGateway3ViewData,
	// 	buildGateway3CheckAnswersList()
	// );

	router.get(
		'/',
		getJourneyResponseFromCase,
		getJourney,
		setAsEditingFromCya,
		setGateway3ViewData,
		buildGateway3CheckAnswersList()
	);
	// Upload documents (case-scoped)
	router.post(
		'/:planReference/gateway-3-submission/:section/:question/upload-documents',
		getJourneyResponseFromCase,
		getJourney,
		upload.array('files[]'),
		lusca.csrf(),
		uploadGateway3DocumentForCase,
		handleMulterFileSizeError
	);

	// Delete documents (case-scoped)
	router.post(
		'/:planReference/gateway-3-submission/:section/:question/delete-document/:fileId',
		getJourneyResponseFromCase,
		getJourney,
		deleteGateway3DocumentForCase
	);

	// Download document (case-scoped)
	router.get(
		'/:planReference/gateway-3-submission/download-document/:documentId',
		getJourneyResponseFromCase,
		downloadGateway3Document
	);

	// Question page GET (case-scoped)
	router.get(
		'/:planReference/gateway-3-submission/:section/:question{/:manageListAction/:manageListItemId/:manageListQuestion}',
		getJourneyResponseFromCase,
		getJourney,
		fileUploaderMiddlewareForCase,
		question
	);

	// Question page POST (case-scoped)
	router.post(
		'/:planReference/gateway-3-submission/:section/:question{/:manageListAction/:manageListItemId/:manageListQuestion}',
		getJourneyResponseFromCase,
		getJourney,
		validate,
		validationErrorHandler,
		redirectAfterCaseQuestionEdit
	);
	return router;
}
