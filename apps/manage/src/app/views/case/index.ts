import { type IRouter, type Request, Router as createRouter, type RequestHandler } from 'express';
import {
	addCaseNavigation,
	buildGetJourneyMiddleware,
	updateCaseField,
	type Gateway2Request,
	getDeleteCase,
	postMarkAsDeleteCase
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
import { questions, fileUploadQuestionProperties } from './questions.ts';
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
	//createFileUploaderDeleteController,
	createFileUploaderUploadController,
	fileUploaderQuestionMiddleware,
	//FileUploaderQuestion,
	type FileUploaderQuestionProps,
	//type FileUploaderSession,
	type UploadedFile
} from '@pins/local-plans-lib/forms/custom-components/file-uploader/index.ts';
import {
	//getDocumentSetIdsByFolderName,
	//loadGateway2DocumentsByDocumentSetId,
	saveGateway2Documents
} from './documents.ts';

type JourneyFactory = (req: Request, response: JourneyResponse, questions: Record<string, any>) => Journey;

// The Gateway 2 upload routes are shared by all of the document questions.
// Keep the question configs in a couple of route-friendly shapes so the URL in
// `:question` decides which field, validation rules and document set are used.
type FileUploadQuestion = FileUploaderQuestionProps & {
	fieldName: string;
	url: string;
};

// Ordered list for loading each persisted upload when the case page opens.
const gateway2FileUploadQuestionConfigs = fileUploadQuestionProperties as FileUploadQuestion[];
// URL list for the file uploader middleware to recognise upload pages.
const gateway2FileUploadQuestionUrls = gateway2FileUploadQuestionConfigs.map((questionConfig) => questionConfig.url);
// Fast lookup for POST routes such as `/local-plan-timetable/upload-documents`.
const gateway2FileUploadQuestionsByUrl = new Map(
	gateway2FileUploadQuestionConfigs.map((questionConfig) => [questionConfig.url, questionConfig])
);

const upload = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: Math.max(...gateway2FileUploadQuestionConfigs.map((questionConfig) => questionConfig.maxFileSizeBytes))
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
		questionUrls: gateway2FileUploadQuestionUrls,
		sessionKey: fileUploaderCaseSessionKey
	});

	const questionPath = supportsManageList
		? `/${path}/:section/:question{/:manageListAction/:manageListItemId/:manageListQuestion}`
		: `/${path}/:section/:question`;

	// File upload
	const fileUploaderStorage = () => service.createFileStorage(journeyId);
	const uploadDocumentRoute = buildFileUploadRouteHandler(
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
							journeyId: journeyId,
							fieldName: questionConfig.fieldName,
							documentSetFolderName: questionConfig.url
						}
					}),
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
	}
}

function getRouteQuestionUrl(req: Request): string | undefined {
	const questionUrl = Array.isArray(req.params.question) ? req.params.question[0] : req.params.question;
	return questionUrl || undefined;
}

function getRouteFileUploadQuestion(req: Request): FileUploadQuestion {
	const questionUrl = getRouteQuestionUrl(req);
	const questionConfig = questionUrl ? gateway2FileUploadQuestionsByUrl.get(questionUrl) : undefined;
	if (!questionConfig) {
		throw new Error(`No Gateway 2 file upload question configured for "${questionUrl ?? ''}"`);
	}

	return questionConfig;
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

// Retrieves the plan reference from the params and creates the file upload session key.
// Example format: LP-TEST-001:gateway2CoverLetter.
function fileUploaderCaseSessionKey(req: Request) {
	const questionConfig = getRouteFileUploadQuestion(req);
	return fileUploaderCaseSessionKeyForField(req, questionConfig.fieldName);
}

function fileUploaderCaseSessionKeyForField(req: Request, fieldName: string) {
	return `${req.params.planReference}:${fieldName}`;
}

// Keeps a Gateway 2 file upload answer in sync with uploaded files.
export function syncGateway2UploadAnswer(req: Request, fieldName: string, uploadedFiles: UploadedFile[]) {
	console.log(req);
	console.log(fieldName);
	console.log(uploadedFiles);
	// TODO
	return;
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
	const request = req as Gateway2Request;
	return {
		planReference: getRoutePlanReference(req),
		caseId: request.currentCase?.id,
		fieldName: questionConfig.fieldName,
		questionUrl: questionConfig.url
	};
}
