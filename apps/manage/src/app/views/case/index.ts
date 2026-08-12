import { type IRouter, type Request, Router as createRouter, type RequestHandler } from 'express';
import { addCaseNavigation, buildGetJourneyMiddleware, updateCaseField } from './controller.ts';
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
	GATEWAY_1_JOURNEY_ID,
	GATEWAY_2_JOURNEY_ID,
	OVERVIEW_JOURNEY_ID
} from './journey.ts';
import { buildCaseOfficerOptions } from '../../util/options-helper.ts';
import {
	createFileUploaderUploadController,
	fileUploaderQuestionMiddleware,
	FileUploaderQuestion
} from '@pins/local-plans-lib/forms/custom-components/file-uploader/index.ts';

type JourneyFactory = (req: Request, response: JourneyResponse, questions: Record<string, any>) => Journey;

// Extract the questions that are for uploading files
const FILE_UPLOAD_QUESTION_URL_MAP = Object.fromEntries(
	Object.values(questions)
		.filter((key) => key instanceof FileUploaderQuestion)
		.map((entry) => [entry.url, entry])
);

interface CaseJourneyConfig {
	path: string;
	journeyId: string;
	createJourney: JourneyFactory;
	supportsManageList?: boolean;
}

/** To add a new route, add a new object here **/
const CASE_JOURNEYS: CaseJourneyConfig[] = [
	{
		path: 'overview',
		journeyId: OVERVIEW_JOURNEY_ID,
		createJourney: createOverviewJourney,
		supportsManageList: true
	},
	{
		path: 'gateway-1',
		journeyId: GATEWAY_1_JOURNEY_ID,
		createJourney: createGateway1Journey
	},
	{
		path: 'gateway-2',
		journeyId: GATEWAY_2_JOURNEY_ID,
		createJourney: createGateway2Journey,
		supportsManageList: true
	}
];

export function caseRouter(service: ManageService): IRouter {
	const router = createRouter({ mergeParams: true });
	const updateCase = updateCaseField(service);

	router.use(addCaseNavigation());

	for (const config of CASE_JOURNEYS) {
		registerCaseJourney(router, service, config, updateCase);
	}

	return router;
}

function registerCaseJourney(
	router: IRouter,
	service: ManageService,
	config: CaseJourneyConfig,
	updateCase: ReturnType<typeof updateCaseField>
): void {
	const { path, journeyId, createJourney, supportsManageList } = config;

	const getJourney = buildGetJourney((req, journeyResponse) => createJourney(req, journeyResponse, questions));
	const getJourneyResponse = buildGetJourneyMiddleware(service, journeyId);
	const file_upload_urls = Object.keys(FILE_UPLOAD_QUESTION_URL_MAP);

	const fileUploadMiddleware = fileUploaderQuestionMiddleware({
		questionUrls: file_upload_urls,
		sessionKey: fileUploaderCaseSessionKey
	});

	// File upload
	const fileUploaderStorage = () => service.createFileStorage(journeyId);
	const fileUploadQuestions: FileUploaderQuestion[] = Object.values(FILE_UPLOAD_QUESTION_URL_MAP);
	console.log('fileUploadQuestions questions');
	console.log(fileUploadQuestions);
	const updatedMap = new Map(
		fileUploadQuestions.map((questionConfig) => [
			questionConfig.url as string,
			createFileUploaderUploadController({
				fieldName: questionConfig.fieldName,
				question: questionConfig,
				storage: fileUploaderStorage,
				sessionKey: fileUploaderCaseSessionKey,
				destination: (req) => {
					return {
						folderPath: `${req.currentCase?.id ?? req.params.planReference}/${questionConfig.url}`,
						metadata: {
							journeyId: journeyId,
							caseId: req.currentCase?.id,
							caseReference: req.params.planReference,
							fieldName: questionConfig.fieldName,
							documentSetFolderName: questionConfig.url
						}
					};
				}
			})
		])
	);
	console.log('updatedMap');
	console.log(updatedMap);
	const fileUploadRouteHandler = buildFileUploadRouteHandler(updatedMap);

	const questionPath = supportsManageList
		? `/${path}/:section/:question{/:manageListAction/:manageListItemId/:manageListQuestion}`
		: `/${path}/:section/:question`;

	// List view
	router.get(
		`/${path}`,
		getJourneyResponse,
		getJourney,
		fileUploadMiddleware,
		buildCaseOfficerOptions(service, questions),
		buildList()
	);

	// Single question view
	router.get(
		questionPath,
		getJourneyResponse,
		getJourney,
		fileUploadMiddleware,
		buildCaseOfficerOptions(service, questions),
		question
	);

	// Save answer
	router.post(
		questionPath,
		getJourneyResponse,
		getJourney,
		fileUploadMiddleware,
		buildCaseOfficerOptions(service, questions),
		validate,
		validationErrorHandler,
		buildSave(updateCase, true),
		fileUploadRouteHandler
	);
}

function fileUploaderCaseSessionKey(req: Request) {
	const questionConfig = getRouteFileUploadQuestion(req);
	return fileUploaderCaseSessionKeyForField(req, questionConfig.fieldName);
}

function fileUploaderCaseSessionKeyForField(req: Request, fieldName: string) {
	return `${req.params.planReference}:${fieldName}`;
}

function getRouteQuestionUrl(req: Request): string | undefined {
	const questionUrl = Array.isArray(req.params.question) ? req.params.question[0] : req.params.question;
	return questionUrl || undefined;
}

function getRouteFileUploadQuestion(req: Request): FileUploaderQuestion {
	const questionUrl = getRouteQuestionUrl(req);
	const questionConfig = questionUrl ? FILE_UPLOAD_QUESTION_URL_MAP[questionUrl] : undefined;
	if (!questionConfig) {
		throw new Error(`No file upload question configured for "${questionUrl ?? ''}"`);
	}

	return questionConfig;
}

function buildFileUploadRouteHandler(handlersByQuestionUrl: Map<string, RequestHandler>): RequestHandler {
	return (req, res, next) => {
		console.log('calling buildFileUploadRouteHandler inner');
		const questionUrl = getRouteQuestionUrl(req);
		console.log(questionUrl);
		const handler = questionUrl ? handlersByQuestionUrl.get(questionUrl) : undefined;
		console.log(handler);
		if (!handler) {
			return res.status(404).render('views/errors/404.njk');
		}

		return handler(req, res, next);
	};
}
