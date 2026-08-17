import { type IRouter, type Request, Router as createRouter, type RequestHandler } from 'express';
import {
	addCaseNavigation,
	buildGetJourneyMiddleware,
	updateCaseField,
	type Gateway2Request,
	getDeleteCase,
	postMarkAsDeleteCase,
	type UploadDocumentRequest,
	fileUploadQuestionConfigs,
	fileUploadQuestionUrls,
	type FileUploadQuestion,
	getRouteQuestionUrl,
	fileUploaderCaseSessionKey
} from './controller.ts';
import type { ManageService } from '#service';
import {
	buildGetJourney,
	buildList,
	buildSave,
	question,
	validate,
	validationErrorHandler,
	type Journey,
	type JourneyResponse
} from '@planning-inspectorate/dynamic-forms';
import { questions } from './questions.ts';
import {
	createOverviewJourney,
	createGateway1Journey,
	createGateway2Journey,
	createGateway3Journey,
	createExaminationJourney,
	GATEWAY_1_JOURNEY_ID,
	GATEWAY_2_JOURNEY_ID,
	GATEWAY_3_JOURNEY_ID,
	OVERVIEW_JOURNEY_ID,
	EXAMINATION_JOURNEY_ID
} from './journey.ts';
import { buildCaseOfficerOptions, buildInspectorOptions } from '../../util/options-helper.ts';
import multer from 'multer';
import {
	createFileUploaderDeleteController,
	createFileUploaderUploadController,
	fileUploaderQuestionMiddleware,
	type UploadedFile
} from '@pins/local-plans-lib/forms/custom-components/file-uploader/index.ts';
import { saveDocuments } from './documents.ts';

type JourneyFactory = (req: Request, response: JourneyResponse, questions: Record<string, any>) => Journey;

const upload = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: Math.max(...fileUploadQuestionConfigs.map((questionConfig) => questionConfig.maxFileSizeBytes))
	}
});

interface CaseJourneyConfig {
	path: string;
	journeyId: string;
	createJourney: JourneyFactory;
	supportsManageList?: boolean;
	supportsFileUpload?: boolean;
}

/** To add a new route, add a new object here **/
const CASE_JOURNEYS: CaseJourneyConfig[] = [
	{
		path: 'overview',
		journeyId: OVERVIEW_JOURNEY_ID,
		createJourney: createOverviewJourney,
		supportsManageList: true,
		supportsFileUpload: false
	},
	{
		path: 'gateway-1',
		journeyId: GATEWAY_1_JOURNEY_ID,
		createJourney: createGateway1Journey,
		supportsFileUpload: false
	},
	{
		path: 'gateway-2',
		journeyId: GATEWAY_2_JOURNEY_ID,
		createJourney: createGateway2Journey,
		supportsManageList: true,
		supportsFileUpload: true
	},
	{
		path: 'gateway-3',
		journeyId: GATEWAY_3_JOURNEY_ID,
		createJourney: createGateway3Journey
	},
	{
		path: 'examination',
		journeyId: EXAMINATION_JOURNEY_ID,
		createJourney: createExaminationJourney,
		supportsManageList: true,
		supportsFileUpload: false
	}
];

export function caseRouter(service: ManageService): IRouter {
	console.log('Building case router');
	const router = createRouter({ mergeParams: true });
	const updateCase = updateCaseField(service);

	router.use(addCaseNavigation());

	for (const config of CASE_JOURNEYS) {
		registerCaseJourney(router, service, config, updateCase);
	}

	/**
	 * Delete case
	 */
	router.get('/delete-case', getDeleteCase(service));
	router.post('/delete-case', postMarkAsDeleteCase(service));

	return router;
}

function registerCaseJourney(
	router: IRouter,
	service: ManageService,
	config: CaseJourneyConfig,
	updateCase: ReturnType<typeof updateCaseField>
): void {
	const { path, journeyId, createJourney, supportsManageList, supportsFileUpload } = config;

	const getJourney = buildGetJourney((req, journeyResponse) => createJourney(req, journeyResponse, questions));
	const getJourneyResponse = buildGetJourneyMiddleware(service, journeyId);

	const fileUploadMiddleware = fileUploaderQuestionMiddleware({
		questionUrls: fileUploadQuestionUrls,
		sessionKey: fileUploaderCaseSessionKey
	});

	const questionPath = supportsManageList
		? `/${path}/:section/:question{/:manageListAction/:manageListItemId/:manageListQuestion}`
		: `/${path}/:section/:question`;

	// List view
	router.get(
		`/${path}`,
		getJourneyResponse,
		buildCaseOfficerOptions(service, questions),
		buildInspectorOptions(service, questions),
		getJourney,
		fileUploadMiddleware,
		buildList()
	);

	// Single question view
	router.get(
		questionPath,
		getJourneyResponse,
		buildCaseOfficerOptions(service, questions),
		buildInspectorOptions(service, questions),
		getJourney,
		fileUploadMiddleware,
		question
	);

	// Save answer
	router.post(
		questionPath,
		getJourneyResponse,
		buildCaseOfficerOptions(service, questions),
		buildInspectorOptions(service, questions),
		getJourney,
		validate,
		validationErrorHandler,
		buildSave(updateCase, true)
	);
	if (supportsFileUpload) {
		const fileUploaderStorage = () => service.createFileStorage(journeyId);
		const uploadDocumentRoute = buildFileUploadRouteHandler(
			new Map(
				fileUploadQuestionConfigs.map((questionConfig) => [
					questionConfig.url,
					createFileUploaderUploadController({
						fieldName: questionConfig.fieldName,
						question: questionConfig,
						storage: fileUploaderStorage,
						destination: (req) => ({
							folderPath: `${req.sessionID ?? 'session'}/${questionConfig.url}`,
							metadata: {
								journeyId: journeyId,
								fieldName: questionConfig.fieldName,
								documentSetFolderName: questionConfig.url
							}
						}),
						onFilesChange: async ({ req, uploadedFiles }) => {
							await saveDocuments(service, req, questionConfig.url, uploadedFiles);
							syncUploadAnswer(journeyId, req, questionConfig.fieldName, uploadedFiles);
							logFileUploaded(service, req, questionConfig, uploadedFiles);
						},
						onUploadError: ({ req, errors, error }) => logUploadFailed(service, req, questionConfig, { errors, error }),
						onUploadCleanupError: ({ req, file, error }) =>
							logUploadCleanupFailed(service, req, questionConfig, file, error),
						redirect: redirectToFileUploaderQuestion
					})
				])
			)
		);
		const deleteDocumentRoute = buildFileUploadRouteHandler(
			new Map(
				fileUploadQuestionConfigs.map((questionConfig) => [
					questionConfig.url,
					createFileUploaderDeleteController({
						fieldName: questionConfig.fieldName,
						question: questionConfig,
						storage: fileUploaderStorage,
						onFilesChange: async ({ req, uploadedFiles }) => {
							await saveDocuments(service, req, questionConfig.url, uploadedFiles);
							syncUploadAnswer(journeyId, req, questionConfig.fieldName, uploadedFiles);
							logDocumentDeleted(service, req, questionConfig, uploadedFiles);
						},
						onDeleteError: ({ req, fileId, error }) =>
							logDocumentDeleteFailed(service, req, questionConfig, fileId, error),
						redirect: redirectToFileUploaderQuestion
					})
				])
			)
		);
		router.post(
			`${questionPath}/upload-documents`,
			getJourneyResponse,
			buildCaseOfficerOptions(service, questions),
			getJourney,
			upload.array('files[]'),
			uploadDocumentRoute
		);
		router.post(
			`${questionPath}/delete-document/:fileId`,
			getJourneyResponse,
			buildCaseOfficerOptions(service, questions),
			getJourney,
			deleteDocumentRoute
		);
	}
}

/**
 * Create a route handler
 * @param handlersByQuestionUrl A map of question to the underlying handler object
 * @returns The result of the request handler
 */
function buildFileUploadRouteHandler(handlersByQuestionUrl: Map<string, RequestHandler>): RequestHandler {
	return (req, res, next) => {
		const questionUrl = getRouteQuestionUrl(req);
		const handler = questionUrl ? handlersByQuestionUrl.get(questionUrl) : undefined;
		if (!handler || typeof handler !== 'function') {
			return res.status(404).render('views/errors/404.njk');
		}

		return handler(req, res, next);
	};
}

/**
 * Keeps a file upload answer in sync with uploaded files.
 * @param journeyId The id of the journey
 * @param req The request that holds the session details
 * @param fieldName The field that the uploaded file belongs to
 * @param uploadedFiles An array of uploaded files
 */
export function syncUploadAnswer(journeyId: string, req: Request, fieldName: string, uploadedFiles: UploadedFile[]) {
	if (!req.session) {
		return;
	}

	const request = req as UploadDocumentRequest;
	const planReference = getRoutePlanReference(req);
	const forms = (request.session.forms ??= {});

	const answers = planReference
		? getOrCreateRecord(getOrCreateRecord(forms, planReference), journeyId)
		: getOrCreateRecord(forms, journeyId);

	if (uploadedFiles.length > 0) {
		answers[fieldName] = uploadedFiles;
		return;
	}

	delete answers[fieldName];
}

function logFileUploaded(
	service: ManageService,
	req: Request,
	questionConfig: FileUploadQuestion,
	uploadedFiles: UploadedFile[]
) {
	service.logger.info(
		{
			...uploadLogContext(req, questionConfig),
			fileCount: uploadedFiles.length
		},
		'Document uploaded'
	);
}

function logUploadFailed(
	service: ManageService,
	req: Request,
	questionConfig: FileUploadQuestion,
	{ errors, error }: { errors?: Array<{ text: string; href: string }>; error?: unknown }
) {
	const context = {
		...uploadLogContext(req, questionConfig),
		errorCount: errors?.length ?? 0
	};

	if (error) {
		service.logger.error({ ...context, error }, 'Document upload failed');
		return;
	}

	service.logger.warn(context, 'Gateway 2 document upload failed');
}

function logUploadCleanupFailed(
	service: ManageService,
	req: Request,
	questionConfig: FileUploadQuestion,
	file: UploadedFile,
	error: unknown
) {
	service.logger.error(
		{
			...uploadLogContext(req, questionConfig),
			fileId: file.id,
			error
		},
		'Document upload cleanup failed'
	);
}

// Builds the URL for the current file upload question.
function redirectToFileUploaderQuestion(req: Request) {
	const planPath = req.params.planReference ? `/${req.params.planReference}` : '';
	// Any questions that need to route to new subjourneys can be defined here
	if (req.params.question == 'gateway-2-workshop-document') {
		return `${req.baseUrl}${planPath}/gateway-2/${req.params.section}/${req.params.question}`;
	}
	const journey = req.url.split(String(req.params.section))[0];
	return `${req.baseUrl}${planPath}${journey}${req.params.section}/${req.params.question}`;
}

function getRoutePlanReference(req: Request): string | undefined {
	const planReference = Array.isArray(req.params.planReference)
		? req.params.planReference[0]
		: req.params.planReference;

	return planReference || undefined;
}

function uploadLogContext(req: Request, questionConfig: FileUploadQuestion) {
	const request = req as UploadDocumentRequest;
	return {
		planReference: getRoutePlanReference(req),
		caseId: request.currentCase?.id,
		fieldName: questionConfig.fieldName,
		questionUrl: questionConfig.url
	};
}

function logDocumentDeleted(
	service: ManageService,
	req: Request,
	questionConfig: FileUploadQuestion,
	uploadedFiles: UploadedFile[]
) {
	service.logger.info(
		{
			...uploadLogContext(req, questionConfig),
			fileId: req.params.fileId,
			remainingFileCount: uploadedFiles.length
		},
		'Document deleted'
	);
}

function logDocumentDeleteFailed(
	service: ManageService,
	req: Request,
	questionConfig: FileUploadQuestion,
	fileId: string,
	error: unknown
) {
	service.logger.error(
		{
			...uploadLogContext(req, questionConfig),
			fileId,
			error
		},
		'Document delete failed'
	);
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
	return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined;
}

function getOrCreateRecord(container: Record<string, unknown>, key: string): Record<string, unknown> {
	const existingValue = asRecord(container[key]);
	if (existingValue) {
		return existingValue;
	}

	const value: Record<string, unknown> = {};
	container[key] = value;
	return value;
}
