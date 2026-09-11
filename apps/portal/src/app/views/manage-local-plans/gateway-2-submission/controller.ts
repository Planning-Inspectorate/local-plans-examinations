import type { PortalService } from '#service';
import { type NextFunction, type Request, type RequestHandler, type Response } from 'express';
import multer from 'multer';
import {
	buildList,
	buildSave,
	buildSaveDataToSession,
	JourneyResponse,
	type SaveDataFn,
	type SaveParams,
	saveDataToSession
} from '@planning-inspectorate/dynamic-forms';
import { JOURNEY_ID } from './journey.ts';
import { CHECK_ANSWERS_REDIRECT_QUERY, CHECK_ANSWERS_REDIRECTS, GW2QUESTIONS } from './questions.ts';
import { getDocumentSetIdsByFolderName, loadGateway2DocumentsByDocumentSetId } from './documents.ts';
import {
	type FileUploaderQuestionProps,
	type FileUploaderSession,
	type UploadedFile
} from '@pins/local-plans-lib/forms/custom-components/file-uploader/index.ts';
import type { CaseModel } from '@pins/local-plans-database/src/client/models/Case.ts';
import { getRoutePlanReference } from './utils.ts';

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
type Gateway2FileUploadQuestion = FileUploaderQuestionProps & {
	fieldName: string;
	url: string;
};

// Ordered list for loading each persisted upload when the case page opens.
export const gateway2FileUploadQuestionConfigs = Object.values(GW2QUESTIONS) as Gateway2FileUploadQuestion[];
// URL list for the file uploader middleware to recognise upload pages.
export const gateway2FileUploadQuestionUrls = gateway2FileUploadQuestionConfigs.map(
	(questionConfig) => questionConfig.url
);
// Fast lookup for POST routes such as `/local-plan-timetable/upload-documents`.
export const gateway2FileUploadQuestionsByUrl = new Map(
	gateway2FileUploadQuestionConfigs.map((questionConfig) => [questionConfig.url, questionConfig])
);
const GATEWAY_2_SUBMIT_ERROR = 'Add at least one document before submitting';

type Gateway2Session = Request['session'] &
	FileUploaderSession & {
		editingFromCheckAnswers?: boolean;
		forms?: Record<string, unknown>;
	};

export type Gateway2Request = Request & {
	currentCase?: CaseModel;
	session: Gateway2Session;
};

// TODO: This shared Multer middleware uses the largest Gateway 2 question
// upload limit because the upload routes are shared and the current question is
// resolved later.
export const upload = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: Math.max(...gateway2FileUploadQuestionConfigs.map((questionConfig) => questionConfig.maxFileSizeBytes))
	}
});

export function handleMulterFileSizeError(err: Error, req: Request, res: Response, next: NextFunction) {
	if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
		const questionUrl = getRouteQuestionUrl(req);
		const questionConfig = questionUrl ? gateway2FileUploadQuestionsByUrl.get(questionUrl) : undefined;
		const sizeLabel = questionConfig?.maxFileSizeLabel ?? '250MB';
		const session = req.session as unknown as {
			errors?: Record<string, { msg: string }>;
			errorSummary?: Array<{ text: string; href: string }>;
		};
		session.errors = { 'upload-form': { msg: 'Errors encountered during file upload' } };
		session.errorSummary = [{ text: `The selected file must be smaller than ${sizeLabel}`, href: '#upload-form' }];
		return res.redirect(redirectToFileUploaderQuestion(req));
	}
	return next(err);
}

// Marks the user as editing from the check answers page.
export function setAsEditingFromCya(req: Request, _: Response, next: NextFunction) {
	const request = req as Gateway2Request;
	request.session.editingFromCheckAnswers = true;
	next();
}

// Saves the answer and sends the user back to check answers when needed.
export function redirectAfterCyaEdit(req: Request, res: Response, next: NextFunction) {
	const request = req as Gateway2Request;
	const returnToCya = getCheckAnswersRedirect(req) ?? request.session.editingFromCheckAnswers === true;
	buildSave(saveDataToSession, returnToCya)(req, res, next);
}

// Saves the case answer and returns to check answers by default.
export function redirectAfterCaseQuestionEdit(saveDataToCase: ReturnType<typeof buildSaveDataToCase>) {
	return (req: Request, res: Response, next: NextFunction) => {
		const returnToCya = getCheckAnswersRedirect(req) ?? true;
		buildSave(saveDataToCase, returnToCya)(req, res, next);
	};
}

// TODO: Move this to a shared manage-local-plans utility when Gateway 3 or
// other manage workflow sections use the same check answers redirect pattern.
// Reads the check answers redirect query and converts it to true or false.
function getCheckAnswersRedirect(req: Request): boolean | undefined {
	const redirect = Array.isArray(req.query?.[CHECK_ANSWERS_REDIRECT_QUERY])
		? req.query[CHECK_ANSWERS_REDIRECT_QUERY][0]
		: req.query?.[CHECK_ANSWERS_REDIRECT_QUERY];

	if (redirect === CHECK_ANSWERS_REDIRECTS.CHECK_YOUR_ANSWERS) {
		return true;
	}

	if (redirect === CHECK_ANSWERS_REDIRECTS.NEXT_QUESTION) {
		return false;
	}
}

// Builds the URL for the current file upload question.
export function redirectToFileUploaderQuestion(req: Request) {
	return `${req.baseUrl}/${req.params.section}/${req.params.question}`;
}

function getRouteQuestionUrl(req: Request): string | undefined {
	const questionUrl = Array.isArray(req.params.question) ? req.params.question[0] : req.params.question;
	return questionUrl || undefined;
}

function getRouteFileUploadQuestion(req: Request): Gateway2FileUploadQuestion {
	const questionUrl = getRouteQuestionUrl(req);
	const questionConfig = questionUrl ? gateway2FileUploadQuestionsByUrl.get(questionUrl) : undefined;
	if (!questionConfig) {
		throw new Error(`No Gateway 2 file upload question configured for "${questionUrl ?? ''}"`);
	}

	return questionConfig;
}

export function buildFileUploadRouteHandler(handlersByQuestionUrl: Map<string, RequestHandler>): RequestHandler {
	return (req, res, next) => {
		const questionUrl = getRouteQuestionUrl(req);
		const handler = questionUrl ? handlersByQuestionUrl.get(questionUrl) : undefined;
		if (!handler || typeof handler !== 'function') {
			return renderNotFound(res);
		}

		return handler(req, res, next);
	};
}

// Loads the case for the plan reference and creates the journey response.
export function buildGetJourneyResponseFromCase(service: PortalService): RequestHandler {
	return async (req, res, next) => {
		const routePlanReference = getRoutePlanReference(req);
		const planReference = getPlanReference(req);
		if (!planReference) {
			return renderNotFound(res);
		}

		const currentCase = await service.db.case.findUnique({
			where: { reference: planReference }
		});

		if (!currentCase) {
			return renderNotFound(res);
		}

		const request = req as Gateway2Request;
		request.currentCase = currentCase;
		const answers = getCaseScopedSessionAnswers(req, routePlanReference ?? planReference);
		const documentSetIdsByFolderName = await getDocumentSetIdsByFolderName(
			service,
			gateway2FileUploadQuestionConfigs.map((questionConfig) => questionConfig.url)
		);

		for (const questionConfig of gateway2FileUploadQuestionConfigs) {
			const documentSetId = documentSetIdsByFolderName.get(questionConfig.url);
			if (!documentSetId) {
				throw new Error(
					`Missing document set reference data for "${questionConfig.url}". Run the database static seed.`
				);
			}

			const uploadedFiles = await loadGateway2DocumentsByDocumentSetId(service, currentCase.id, documentSetId);
			setFileUploaderUploadedFiles(
				request,
				fileUploaderCaseSessionKeyForField(req, questionConfig.fieldName),
				uploadedFiles
			);
			if (uploadedFiles.length > 0) {
				answers[questionConfig.fieldName] = uploadedFiles;
			} else {
				delete answers[questionConfig.fieldName];
			}
		}

		res.locals.journeyResponse = new JourneyResponse(JOURNEY_ID, currentCase.id, {
			...answers
		});

		return next();
	};
}

export function setGateway2CheckAnswersViewData(req: Request, res: Response, next: NextFunction) {
	setGateway2CheckAnswersViewLocals(req, res);
	next();
}

function setGateway2CheckAnswersViewLocals(req: Request, res: Response) {
	const request = req as Gateway2Request;
	const planReference = getRoutePlanReference(req);
	const currentCase = request.currentCase;

	res.locals.pageTitle = 'Gateway 2 submission';
	res.locals.pageHeading = 'Gateway 2 submission';
	res.locals.pageCaption = currentCase?.planTitle;

	if (planReference) {
		const encodedPlanReference = encodeURIComponent(planReference);
		res.locals.backLinkUrl = `/manage-local-plans/${encodedPlanReference}`;
		res.locals.saveAndComeBackUrl = `/manage-local-plans/${encodedPlanReference}`;
	}

	if (currentCase?.gateway2Date) {
		res.locals.targetDate = formatDisplayDate(currentCase.gateway2Date);
	}
}

export function buildGateway2CheckAnswersList(): RequestHandler {
	return (req, res, next) => {
		const request = req as Gateway2Request;
		return buildList({
			pageCaption: request.currentCase?.planTitle
		})(req, res, next);
	};
}

export function validateGateway2Submission(): RequestHandler {
	return (req, res, next) => {
		const journeyResponse = res.locals.journeyResponse as JourneyResponse | undefined;
		const answers = journeyResponse?.answers ?? {};
		const hasAnsweredQuestion = gateway2FileUploadQuestionConfigs.some((questionConfig) => {
			const answer = answers[questionConfig.fieldName];
			return Array.isArray(answer) && answer.length > 0;
		});

		if (hasAnsweredQuestion) {
			return next();
		}

		setGateway2CheckAnswersViewLocals(req, res);
		res.status(400);
		res.locals.errors = {
			submit: {
				text: GATEWAY_2_SUBMIT_ERROR
			}
		};
		res.locals.errorSummary = [
			{
				text: GATEWAY_2_SUBMIT_ERROR,
				href: '#procedural-documents'
			}
		];

		return buildGateway2CheckAnswersList()(req, res, next);
	};
}

function formatDisplayDate(date: Date) {
	return date.toLocaleDateString('en-GB', {
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	});
}

// Saves case-scoped answers into the session.
export function buildSaveDataToCase(): SaveDataFn {
	const saveDataToCaseSession = buildSaveDataToSession({ reqParam: 'planReference' });

	return async (params: SaveParams) => {
		await saveDataToCaseSession(params);
	};
}

// Gets saved answers for this plan and journey from the session.
function getCaseScopedSessionAnswers(req: Request, planReference: string): Record<string, unknown> {
	const request = req as Gateway2Request;
	const planForms = asRecord(request.session.forms?.[planReference]);
	const answers = asRecord(planForms?.[JOURNEY_ID]);
	if (!answers) {
		return {};
	}

	return Object.fromEntries(
		Object.entries(answers).map(([key, value]) => [key, typeof value === 'boolean' ? (value ? 'yes' : 'no') : value])
	);
}

// Retrieves the plan reference from the params and creates the file upload session key.
// Example format: LP-TEST-001:gateway2CoverLetter.
export function fileUploaderCaseSessionKey(req: Request) {
	const questionConfig = getRouteFileUploadQuestion(req);
	return fileUploaderCaseSessionKeyForField(req, questionConfig.fieldName);
}

function fileUploaderCaseSessionKeyForField(req: Request, fieldName: string) {
	return `${req.params.planReference}:${fieldName}`;
}

// Populates the generic file uploader session from persisted case documents.
function setFileUploaderUploadedFiles(req: Gateway2Request, sessionKey: string, uploadedFiles: UploadedFile[]) {
	req.session.fileUploader = {
		...req.session.fileUploader,
		[sessionKey]: {
			uploadedFiles
		}
	};
}

// Keeps a Gateway 2 file upload answer in sync with uploaded files.
export function syncGateway2UploadAnswer(req: Request, fieldName: string, uploadedFiles: UploadedFile[]) {
	if (!req.session) {
		return;
	}

	const request = req as Gateway2Request;
	const planReference = getRoutePlanReference(req);
	const forms = (request.session.forms ??= {});
	const answers = planReference
		? getOrCreateRecord(getOrCreateRecord(forms, planReference), JOURNEY_ID)
		: getOrCreateRecord(forms, JOURNEY_ID);

	if (uploadedFiles.length > 0) {
		answers[fieldName] = uploadedFiles;
		return;
	}

	delete answers[fieldName];
}

// Gets the decoded plan reference in the format used by the database.
function getPlanReference(req: Request): string | undefined {
	return getRoutePlanReference(req);
}

// Renders the standard page not found screen.
function renderNotFound(res: Response) {
	return res.status(404).render('views/layouts/error', {
		pageTitle: 'Page not found',
		messages: [
			'If you typed the web address, check it is correct.',
			'If you pasted the web address, check you copied the entire address.'
		]
	});
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

function gateway2UploadLogContext(req: Request, questionConfig: Gateway2FileUploadQuestion) {
	const request = req as Gateway2Request;
	return {
		planReference: getRoutePlanReference(req),
		caseId: request.currentCase?.id,
		fieldName: questionConfig.fieldName,
		questionUrl: questionConfig.url
	};
}

export function logGateway2Uploaded(
	service: PortalService,
	req: Request,
	questionConfig: Gateway2FileUploadQuestion,
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

export function logGateway2UploadFailed(
	service: PortalService,
	req: Request,
	questionConfig: Gateway2FileUploadQuestion,
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

export function logGateway2UploadCleanupFailed(
	service: PortalService,
	req: Request,
	questionConfig: Gateway2FileUploadQuestion,
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

export function logGateway2Deleted(
	service: PortalService,
	req: Request,
	questionConfig: Gateway2FileUploadQuestion,
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

export function logGateway2DeleteFailed(
	service: PortalService,
	req: Request,
	questionConfig: Gateway2FileUploadQuestion,
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
