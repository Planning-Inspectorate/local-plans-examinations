import type { PortalService } from '#service';
import { type IRouter, Router as createRouter } from 'express';
import {
	buildGetJourney,
	buildGetJourneyResponseFromSession,
	question,
	validate,
	validationErrorHandler
} from '@planning-inspectorate/dynamic-forms';
import { createJourney, JOURNEY_ID } from './journey.ts';
import { createGateway2Questions } from './questions.ts';
import { buildSaveController } from './save.ts';
import { saveGateway2Documents } from './documents.ts';
import { asyncHandler } from '@planning-inspectorate/core/util';
import {
	createFileUploaderDeleteController,
	createFileUploaderUploadController,
	fileUploaderQuestionMiddleware
} from '@pins/local-plans-lib/forms/custom-components/file-uploader/index.ts';
import { getRoutePlanReference } from './utils.ts';
import { createApplicationCompleteRoutes } from './application-complete/index.ts';
import { createApplicationDeclarationRoutes } from './application-declaration/index.ts';
import { downloadGateway2Document } from './download.ts';
import lusca from 'lusca';
import {
	type Gateway2Request,
	buildFileUploadRouteHandler,
	logGateway2Deleted,
	gateway2FileUploadQuestionConfigs,
	fileUploaderCaseSessionKey,
	redirectToFileUploaderQuestion,
	logGateway2UploadFailed,
	syncGateway2UploadAnswer,
	logGateway2UploadCleanupFailed,
	buildGetJourneyResponseFromCase,
	logGateway2Uploaded,
	logGateway2DeleteFailed,
	buildSaveDataToCase,
	setAsEditingFromCya,
	setGateway2CheckAnswersViewData,
	buildGateway2CheckAnswersList,
	validateGateway2Submission,
	upload,
	handleMulterFileSizeError,
	gateway2FileUploadQuestionUrls,
	redirectAfterCaseQuestionEdit,
	redirectAfterCyaEdit
} from './controller.ts';

// This file wires the Gateway 2 submission journey into Express.
//
// The main sections are:
// - Upload question setup: turns the configured file upload questions into lists
//   and maps that are easier for shared routes to use.
// - Request/session helpers: loads the current case, normalises route params, and
//   keeps the dynamic-forms answers in sync with uploaded files.
// - Upload logging: adds useful context around upload, delete and cleanup events.
// - Route setup: registers the Gateway 2 listing, question, upload and delete
//   routes. The upload/delete routes are shared, so the `:question` URL decides
//   which upload config, validation rules and document set are used.

// The Gateway 2 upload routes are shared by all of the document questions.
// Keep the question configs in a couple of route-friendly shapes so the URL in
// `:question` decides which field, validation rules and document set are used.

// Registers the Gateway 2 submission routes.
export function gateway2SubmissionRoutes(service: PortalService): IRouter {
	const router = createRouter({ mergeParams: true });

	// read answers from the session
	const getJourneyResponse = buildGetJourneyResponseFromSession(JOURNEY_ID);
	const getJourney = buildGetJourney((req, journeyResponse) =>
		createJourney(req, journeyResponse, createGateway2Questions(getRoutePlanReference(req)))
	);
	const getJourneyResponseFromCase = asyncHandler(buildGetJourneyResponseFromCase(service));
	const saveToDatabase = asyncHandler(buildSaveController(service));
	const saveDataToCase = buildSaveDataToCase();
	const fileUploaderStorage = () => service.createFileStorage(JOURNEY_ID);
	const uploadGateway2Document = buildFileUploadRouteHandler(
		new Map(
			gateway2FileUploadQuestionConfigs.map((questionConfig) => [
				questionConfig.url,
				createFileUploaderUploadController({
					fieldName: questionConfig.fieldName,
					question: questionConfig,
					storage: fileUploaderStorage,
					destination: (req) => ({
						folderPath: `${req.sessionID ?? 'session'}/${questionConfig.url}`,
						metadata: {
							journeyId: JOURNEY_ID,
							fieldName: questionConfig.fieldName,
							documentSetFolderName: questionConfig.url
						}
					}),
					onFilesChange: ({ req, uploadedFiles }) => {
						syncGateway2UploadAnswer(req, questionConfig.fieldName, uploadedFiles);
						logGateway2Uploaded(service, req, questionConfig, uploadedFiles);
					},
					onUploadError: ({ req, errors, error }) =>
						logGateway2UploadFailed(service, req, questionConfig, { errors, error }),
					onUploadCleanupError: ({ req, file, error }) =>
						logGateway2UploadCleanupFailed(service, req, questionConfig, file, error),
					redirect: redirectToFileUploaderQuestion
				})
			])
		)
	);
	const uploadGateway2DocumentForCase = buildFileUploadRouteHandler(
		new Map(
			gateway2FileUploadQuestionConfigs.map((questionConfig) => [
				questionConfig.url,
				createFileUploaderUploadController({
					fieldName: questionConfig.fieldName,
					question: questionConfig,
					storage: fileUploaderStorage,
					sessionKey: fileUploaderCaseSessionKey,
					destination: (req) => {
						const request = req as Gateway2Request;
						return {
							folderPath: `${request.currentCase?.id ?? req.params.planReference}/${questionConfig.url}`,
							metadata: {
								journeyId: JOURNEY_ID,
								caseId: request.currentCase?.id,
								caseReference: req.params.planReference,
								fieldName: questionConfig.fieldName,
								documentSetFolderName: questionConfig.url
							}
						};
					},
					onFilesChange: async ({ req, uploadedFiles }) => {
						await saveGateway2Documents(service, req, questionConfig.url, uploadedFiles);
						syncGateway2UploadAnswer(req, questionConfig.fieldName, uploadedFiles);
						logGateway2Uploaded(service, req, questionConfig, uploadedFiles);
					},
					onUploadError: ({ req, errors, error }) =>
						logGateway2UploadFailed(service, req, questionConfig, { errors, error }),
					onUploadCleanupError: ({ req, file, error }) =>
						logGateway2UploadCleanupFailed(service, req, questionConfig, file, error),
					redirect: redirectToFileUploaderQuestion
				})
			])
		)
	);
	const deleteGateway2Document = buildFileUploadRouteHandler(
		new Map(
			gateway2FileUploadQuestionConfigs.map((questionConfig) => [
				questionConfig.url,
				createFileUploaderDeleteController({
					fieldName: questionConfig.fieldName,
					question: questionConfig,
					storage: fileUploaderStorage,
					onFilesChange: ({ req, uploadedFiles }) => {
						syncGateway2UploadAnswer(req, questionConfig.fieldName, uploadedFiles);
						logGateway2Deleted(service, req, questionConfig, uploadedFiles);
					},
					onDeleteError: ({ req, fileId, error }) =>
						logGateway2DeleteFailed(service, req, questionConfig, fileId, error),
					redirect: redirectToFileUploaderQuestion
				})
			])
		)
	);
	const deleteGateway2DocumentForCase = buildFileUploadRouteHandler(
		new Map(
			gateway2FileUploadQuestionConfigs.map((questionConfig) => [
				questionConfig.url,
				createFileUploaderDeleteController({
					fieldName: questionConfig.fieldName,
					question: questionConfig,
					storage: fileUploaderStorage,
					sessionKey: fileUploaderCaseSessionKey,
					onFilesChange: async ({ req, uploadedFiles }) => {
						await saveGateway2Documents(service, req, questionConfig.url, uploadedFiles);
						syncGateway2UploadAnswer(req, questionConfig.fieldName, uploadedFiles);
						logGateway2Deleted(service, req, questionConfig, uploadedFiles);
					},
					onDeleteError: ({ req, fileId, error }) =>
						logGateway2DeleteFailed(service, req, questionConfig, fileId, error),
					redirect: redirectToFileUploaderQuestion
				})
			])
		)
	);

	// router.get(
	// 	'/gateway-2-submission',
	// 	getJourneyResponse,
	// 	getJourney,
	// 	setAsEditingFromCya,
	// 	setGateway2CheckAnswersViewData,
	// 	buildGateway2CheckAnswersList()
	// );

	// router.post('/gateway-2-submission', getJourneyResponse, getJourney, validateGateway2Submission(), saveToDatabase);

	router.use('/application-declaration', createApplicationDeclarationRoutes(service));

	router.use('/application-complete', createApplicationCompleteRoutes());

	router.get(
		'',
		getJourneyResponseFromCase,
		getJourney,
		setAsEditingFromCya,
		setGateway2CheckAnswersViewData,
		buildGateway2CheckAnswersList()
	);

	router.post('', getJourneyResponseFromCase, getJourney, validateGateway2Submission(), saveToDatabase);

	router.post(
		'/:section/:question/upload-documents',
		getJourneyResponseFromCase,
		getJourney,
		upload.array('files[]'),
		// Lusca CSRF check performed after Multer handles the multipart/form-data
		lusca.csrf(),
		uploadGateway2DocumentForCase,
		handleMulterFileSizeError
	);

	router.post(
		'/:section/:question/delete-document/:fileId',
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
		'/download-document/:documentId',
		getJourneyResponseFromCase,
		asyncHandler(downloadGateway2Document(service))
	);

	router.get(
		'/:section/:question{/:manageListAction/:manageListItemId/:manageListQuestion}',
		getJourneyResponseFromCase,
		getJourney,
		fileUploaderQuestionMiddleware({
			questionUrls: gateway2FileUploadQuestionUrls,
			sessionKey: fileUploaderCaseSessionKey
		}),
		question
	);

	router.post(
		'/:section/:question{/:manageListAction/:manageListItemId/:manageListQuestion}',
		getJourneyResponseFromCase,
		getJourney,
		validate,
		validationErrorHandler,
		redirectAfterCaseQuestionEdit(saveDataToCase)
	);

	router.get(
		'/gateway-2-submission/:section/:question{/:manageListAction/:manageListItemId/:manageListQuestion}',
		getJourneyResponse,
		getJourney,
		fileUploaderQuestionMiddleware({
			questionUrls: gateway2FileUploadQuestionUrls
		}),
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
