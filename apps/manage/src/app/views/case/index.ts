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
	//FileUploaderQuestion,
	//type FileUploaderSession,
	type UploadedFile
} from '@pins/local-plans-lib/forms/custom-components/file-uploader/index.ts';
import {
	//getDocumentSetIdsByFolderName,
	//loadGateway2DocumentsByDocumentSetId,
	saveGateway2Documents
} from './documents.ts';

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

	// File upload
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
						await saveGateway2Documents(service, req, questionConfig.url, uploadedFiles);
						syncUploadAnswer(journeyId, req, questionConfig.fieldName, uploadedFiles);
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
	const deleteDocumentRoute = buildFileUploadRouteHandler(
		new Map(
			fileUploadQuestionConfigs.map((questionConfig) => [
				questionConfig.url,
				createFileUploaderDeleteController({
					fieldName: questionConfig.fieldName,
					question: questionConfig,
					storage: fileUploaderStorage,
					onFilesChange: async ({ req, uploadedFiles }) => {
						await saveGateway2Documents(service, req, questionConfig.url, uploadedFiles);
						syncUploadAnswer(journeyId, req, questionConfig.fieldName, uploadedFiles);
						logGateway2Deleted(service, req, questionConfig, uploadedFiles);
					},
					onDeleteError: ({ req, fileId, error }) =>
						logGateway2DeleteFailed(service, req, questionConfig, fileId, error),
					redirect: redirectToFileUploaderQuestion
				})
			])
		)
	);

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
		router.post(
			`${questionPath}/upload-documents`,
			getJourneyResponse,
			buildCaseOfficerOptions(service, questions),
			getJourney,
			//buildSave(updateCase, true),
			upload.array('files[]'),
			uploadDocumentRoute
		);
		router.post(
			`${questionPath}/delete-document/:fileId`,
			getJourneyResponse,
			buildCaseOfficerOptions(service, questions),
			getJourney,
			//buildSave(updateCase, true),
			deleteDocumentRoute
		);
	}
}

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

// Keeps a file upload answer in sync with uploaded files.
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

function logGateway2Uploaded(
	service: ManageService,
	req: Request,
	questionConfig: FileUploadQuestion,
	uploadedFiles: UploadedFile[]
) {
	service.logger.info(
		{
			...gateway2UploadLogContext(req, questionConfig),
			fileCount: uploadedFiles.length
		},
		'Gateway 2 document uploaded'
	);
}

function logGateway2UploadFailed(
	service: ManageService,
	req: Request,
	questionConfig: FileUploadQuestion,
	{ errors, error }: { errors?: Array<{ text: string; href: string }>; error?: unknown }
) {
	const context = {
		...gateway2UploadLogContext(req, questionConfig),
		errorCount: errors?.length ?? 0
	};

	if (error) {
		service.logger.error({ ...context, error }, 'Gateway 2 document upload failed');
		return;
	}

	service.logger.warn(context, 'Gateway 2 document upload failed');
}

function logGateway2UploadCleanupFailed(
	service: ManageService,
	req: Request,
	questionConfig: FileUploadQuestion,
	file: UploadedFile,
	error: unknown
) {
	service.logger.error(
		{
			...gateway2UploadLogContext(req, questionConfig),
			fileId: file.id,
			error
		},
		'Gateway 2 document upload cleanup failed'
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

function gateway2UploadLogContext(req: Request, questionConfig: FileUploadQuestion) {
	const request = req as UploadDocumentRequest;
	return {
		planReference: getRoutePlanReference(req),
		caseId: request.currentCase?.id,
		fieldName: questionConfig.fieldName,
		questionUrl: questionConfig.url
	};
}

function logGateway2Deleted(
	service: ManageService,
	req: Request,
	questionConfig: FileUploadQuestion,
	uploadedFiles: UploadedFile[]
) {
	service.logger.info(
		{
			...gateway2UploadLogContext(req, questionConfig),
			fileId: req.params.fileId,
			remainingFileCount: uploadedFiles.length
		},
		'Gateway 2 document deleted'
	);
}

function logGateway2DeleteFailed(
	service: ManageService,
	req: Request,
	questionConfig: FileUploadQuestion,
	fileId: string,
	error: unknown
) {
	service.logger.error(
		{
			...gateway2UploadLogContext(req, questionConfig),
			fileId,
			error
		},
		'Gateway 2 document delete failed'
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
