import type { PortalService } from '#service';
import {
	type IRouter,
	type NextFunction,
	type Request,
	type RequestHandler,
	type Response,
	Router as createRouter
} from 'express';
import multer from 'multer';
import {
	buildGetJourney,
	buildGetJourneyResponseFromSession,
	buildList,
	buildSave,
	buildSaveDataToSession,
	JourneyResponse,
	question,
	type SaveDataFn,
	type SaveParams,
	saveDataToSession,
	validate,
	validationErrorHandler
} from '@planning-inspectorate/dynamic-forms';
import { createJourney, JOURNEY_ID } from './journey.ts';
import {
	CHECK_ANSWERS_REDIRECT_QUERY,
	CHECK_ANSWERS_REDIRECTS,
	gateway2CoverLetterQuestion,
	localPlanTimetableQuestion,
	questions
} from './questions.ts';
import { buildSaveController } from './save.ts';
import {
	loadGateway2CoverLetterDocuments,
	loadLocalPlanTimetableDocuments,
	saveGateway2CoverLetterDocuments,
	saveLocalPlanTimetableDocuments
} from './documents.ts';
import { asyncHandler } from '@pins/local-plans-lib/util/async-handler.ts';
import {
	createFileUploaderDeleteController,
	createFileUploaderUploadController,
	fileUploaderQuestionMiddleware,
	type FileUploaderSession,
	type UploadedFile
} from '@pins/local-plans-lib/forms/custom-components/file-uploader/index.ts';
import type { CaseModel } from '@pins/local-plans-database/src/client/models/Case.ts';

const GATEWAY_2_COVER_LETTER_FIELD = 'gateway2CoverLetter';
const GATEWAY_2_COVER_LETTER_URL = 'gateway-2-cover-letter';
const GATEWAY_2_COVER_LETTER_QUESTION = gateway2CoverLetterQuestion;

const LOCAL_PLAN_TIMETABLE_FIELD = 'localPlanTimetable';
const LOCAL_PLAN_TIMETABLE_URL = 'local-plan-timetable';
const LOCAL_PLAN_TIMETABLE_QUESTION = localPlanTimetableQuestion;

type Gateway2Session = Request['session'] &
	FileUploaderSession & {
		editingFromCheckAnswers?: boolean;
		forms?: Record<string, unknown>;
	};

type Gateway2Request = Request & {
	currentCase?: CaseModel;
	session: Gateway2Session;
};

const upload = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: Math.max(
			GATEWAY_2_COVER_LETTER_QUESTION.maxFileSizeBytes ?? 0,
			LOCAL_PLAN_TIMETABLE_QUESTION.maxFileSizeBytes ?? 0
		),
		files: Math.max(
			GATEWAY_2_COVER_LETTER_QUESTION.maxFilesPerUpload ?? 1,
			LOCAL_PLAN_TIMETABLE_QUESTION.maxFilesPerUpload ?? 1
		)
	}
});

// Marks the user as editing from the check answers page.
function setAsEditingFromCya(req: Request, _: Response, next: NextFunction) {
	const request = req as Gateway2Request;
	request.session.editingFromCheckAnswers = true;
	next();
}

// Saves the answer and sends the user back to check answers when needed.
function redirectAfterCyaEdit(req: Request, res: Response, next: NextFunction) {
	const request = req as Gateway2Request;
	const returnToCya = getCheckAnswersRedirect(req) ?? request.session.editingFromCheckAnswers === true;
	buildSave(saveDataToSession, returnToCya)(req, res, next);
}

// Saves the case answer and returns to check answers by default.
function redirectAfterCaseQuestionEdit(saveDataToCase: ReturnType<typeof buildSaveDataToCase>) {
	return (req: Request, res: Response, next: NextFunction) => {
		const returnToCya = getCheckAnswersRedirect(req) ?? true;
		buildSave(saveDataToCase, returnToCya)(req, res, next);
	};
}

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
function redirectToFileUploaderQuestion(req: Request) {
	const planPath = req.params.planReference ? `/${req.params.planReference}` : '';
	return `${req.baseUrl}${planPath}/gateway-2-submission/${req.params.section}/${req.params.question}`;
}

// Loads the case for the plan reference and creates the journey response.
function buildGetJourneyResponseFromCase(service: PortalService): RequestHandler {
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
		const uploadedFiles = await loadGateway2CoverLetterDocuments(service, currentCase.id);
		setFileUploaderUploadedFiles(request, fileUploaderCaseSessionKey(req), uploadedFiles);
		const timetableFiles = await loadLocalPlanTimetableDocuments(service, currentCase.id);
		setFileUploaderUploadedFiles(request, fileUploaderTimetableCaseSessionKey(req), timetableFiles);
		const answers = getCaseScopedSessionAnswers(req, routePlanReference ?? planReference);
		if (uploadedFiles.length > 0) {
			answers[GATEWAY_2_COVER_LETTER_FIELD] = uploadedFiles;
		} else {
			delete answers[GATEWAY_2_COVER_LETTER_FIELD];
		}
		if (timetableFiles.length > 0) {
			answers[LOCAL_PLAN_TIMETABLE_FIELD] = timetableFiles;
		} else {
			delete answers[LOCAL_PLAN_TIMETABLE_FIELD];
		}

		res.locals.journeyResponse = new JourneyResponse(JOURNEY_ID, currentCase.id, {
			...answers
		});

		return next();
	};
}

// Saves case-scoped answers into the session.
function buildSaveDataToCase(): SaveDataFn {
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
function fileUploaderCaseSessionKey(req: Request) {
	return `${req.params.planReference}:${GATEWAY_2_COVER_LETTER_FIELD}`;
}

// Example format: LP-TEST-001:localPlanTimetable.
function fileUploaderTimetableCaseSessionKey(req: Request) {
	return `${req.params.planReference}:${LOCAL_PLAN_TIMETABLE_FIELD}`;
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

// Keeps the Gateway 2 cover letter answer in sync with uploaded files.
export function syncGateway2CoverLetterAnswer(req: Request, uploadedFiles: UploadedFile[]) {
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
		answers[GATEWAY_2_COVER_LETTER_FIELD] = uploadedFiles;
		return;
	}

	delete answers[GATEWAY_2_COVER_LETTER_FIELD];
}

// Keeps the local plan timetable answer in sync with uploaded files.
export function syncLocalPlanTimetableAnswer(req: Request, uploadedFiles: UploadedFile[]) {
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
		answers[LOCAL_PLAN_TIMETABLE_FIELD] = uploadedFiles;
		return;
	}

	delete answers[LOCAL_PLAN_TIMETABLE_FIELD];
}

// Reads the plan reference from the route params.
function getRoutePlanReference(req: Request): string | undefined {
	const planReference = Array.isArray(req.params.planReference)
		? req.params.planReference[0]
		: req.params.planReference;

	return planReference || undefined;
}

// Gets the plan reference in the format used by the database.
function getPlanReference(req: Request): string | undefined {
	const planReference = getRoutePlanReference(req);
	return normalisePlanReferenceForLookup(planReference);
}

// Converts route references like PLAN-123 to database references like PLAN/123.
export function normalisePlanReferenceForLookup(planReference: string | undefined): string | undefined {
	if (!planReference) {
		return undefined;
	}

	if (/^PLAN-\d+$/.test(planReference)) {
		return planReference.replace('PLAN-', 'PLAN/');
	}

	return planReference;
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

function gateway2CoverLetterLogContext(req: Request) {
	const request = req as Gateway2Request;
	return {
		planReference: getRoutePlanReference(req),
		caseId: request.currentCase?.id,
		fieldName: GATEWAY_2_COVER_LETTER_FIELD
	};
}

function logGateway2CoverLetterUploaded(service: PortalService, req: Request, uploadedFiles: UploadedFile[]) {
	service.logger.info(
		{
			...gateway2CoverLetterLogContext(req),
			fileCount: uploadedFiles.length
		},
		'Gateway 2 cover letter uploaded'
	);
}

function logGateway2CoverLetterUploadFailed(
	service: PortalService,
	req: Request,
	{ errors, error }: { errors?: Array<{ text: string; href: string }>; error?: unknown }
) {
	const context = {
		...gateway2CoverLetterLogContext(req),
		errorCount: errors?.length ?? 0
	};

	if (error) {
		service.logger.error({ ...context, error }, 'Gateway 2 cover letter upload failed');
		return;
	}

	service.logger.warn(context, 'Gateway 2 cover letter upload failed');
}

function logGateway2CoverLetterUploadCleanupFailed(
	service: PortalService,
	req: Request,
	file: UploadedFile,
	error: unknown
) {
	service.logger.error(
		{
			...gateway2CoverLetterLogContext(req),
			fileId: file.id,
			error
		},
		'Gateway 2 cover letter upload cleanup failed'
	);
}

function logGateway2CoverLetterDeleted(service: PortalService, req: Request, uploadedFiles: UploadedFile[]) {
	service.logger.info(
		{
			...gateway2CoverLetterLogContext(req),
			fileId: req.params.fileId,
			remainingFileCount: uploadedFiles.length
		},
		'Gateway 2 cover letter deleted'
	);
}

function logGateway2CoverLetterDeleteFailed(service: PortalService, req: Request, fileId: string, error: unknown) {
	service.logger.error(
		{
			...gateway2CoverLetterLogContext(req),
			fileId,
			error
		},
		'Gateway 2 cover letter delete failed'
	);
}

function localPlanTimetableLogContext(req: Request) {
	const request = req as Gateway2Request;
	return {
		planReference: getRoutePlanReference(req),
		caseId: request.currentCase?.id,
		fieldName: LOCAL_PLAN_TIMETABLE_FIELD
	};
}

function logLocalPlanTimetableUploaded(service: PortalService, req: Request, uploadedFiles: UploadedFile[]) {
	service.logger.info(
		{
			...localPlanTimetableLogContext(req),
			fileCount: uploadedFiles.length
		},
		'Local plan timetable uploaded'
	);
}

function logLocalPlanTimetableUploadFailed(
	service: PortalService,
	req: Request,
	{ errors, error }: { errors?: Array<{ text: string; href: string }>; error?: unknown }
) {
	const context = {
		...localPlanTimetableLogContext(req),
		errorCount: errors?.length ?? 0
	};

	if (error) {
		service.logger.error({ ...context, error }, 'Local plan timetable upload failed');
		return;
	}

	service.logger.warn(context, 'Local plan timetable upload failed');
}

function logLocalPlanTimetableUploadCleanupFailed(
	service: PortalService,
	req: Request,
	file: UploadedFile,
	error: unknown
) {
	service.logger.error(
		{
			...localPlanTimetableLogContext(req),
			fileId: file.id,
			error
		},
		'Local plan timetable upload cleanup failed'
	);
}

function logLocalPlanTimetableDeleted(service: PortalService, req: Request, uploadedFiles: UploadedFile[]) {
	service.logger.info(
		{
			...localPlanTimetableLogContext(req),
			fileId: req.params.fileId,
			remainingFileCount: uploadedFiles.length
		},
		'Local plan timetable deleted'
	);
}

function logLocalPlanTimetableDeleteFailed(service: PortalService, req: Request, fileId: string, error: unknown) {
	service.logger.error(
		{
			...localPlanTimetableLogContext(req),
			fileId,
			error
		},
		'Local plan timetable delete failed'
	);
}

// Registers the Gateway 2 submission routes.
export function gateway2SubmissionRoutes(service: PortalService): IRouter {
	const router = createRouter({ mergeParams: true });

	// read answers from the session
	const getJourneyResponse = buildGetJourneyResponseFromSession(JOURNEY_ID);
	const getJourney = buildGetJourney((req, journeyResponse) => createJourney(req, journeyResponse, questions));
	const getJourneyResponseFromCase = asyncHandler(buildGetJourneyResponseFromCase(service));
	const saveToDatabase = asyncHandler(buildSaveController(service));
	const saveDataToCase = buildSaveDataToCase();
	const fileUploaderStorage = () => service.createFileStorage(JOURNEY_ID);
	const uploadGateway2CoverLetter = createFileUploaderUploadController({
		fieldName: GATEWAY_2_COVER_LETTER_FIELD,
		question: GATEWAY_2_COVER_LETTER_QUESTION,
		storage: fileUploaderStorage,
		destination: (req) => ({
			folderPath: `${req.sessionID ?? 'session'}/${GATEWAY_2_COVER_LETTER_URL}`,
			metadata: {
				journeyId: JOURNEY_ID,
				fieldName: GATEWAY_2_COVER_LETTER_FIELD
			}
		}),
		onFilesChange: ({ req, uploadedFiles }) => {
			syncGateway2CoverLetterAnswer(req, uploadedFiles);
			logGateway2CoverLetterUploaded(service, req, uploadedFiles);
		},
		onUploadError: ({ req, errors, error }) => logGateway2CoverLetterUploadFailed(service, req, { errors, error }),
		onUploadCleanupError: ({ req, file, error }) =>
			logGateway2CoverLetterUploadCleanupFailed(service, req, file, error),
		redirect: redirectToFileUploaderQuestion
	});
	const uploadGateway2CoverLetterForCase = createFileUploaderUploadController({
		fieldName: GATEWAY_2_COVER_LETTER_FIELD,
		question: GATEWAY_2_COVER_LETTER_QUESTION,
		storage: fileUploaderStorage,
		sessionKey: fileUploaderCaseSessionKey,
		destination: (req) => {
			const request = req as Gateway2Request;
			return {
				folderPath: `${request.currentCase?.id ?? req.params.planReference}/${GATEWAY_2_COVER_LETTER_URL}`,
				metadata: {
					journeyId: JOURNEY_ID,
					caseId: request.currentCase?.id,
					caseReference: req.params.planReference,
					fieldName: GATEWAY_2_COVER_LETTER_FIELD
				}
			};
		},
		onFilesChange: async ({ req, uploadedFiles }) => {
			await saveGateway2CoverLetterDocuments(service, req, uploadedFiles);
			syncGateway2CoverLetterAnswer(req, uploadedFiles);
			logGateway2CoverLetterUploaded(service, req, uploadedFiles);
		},
		onUploadError: ({ req, errors, error }) => logGateway2CoverLetterUploadFailed(service, req, { errors, error }),
		onUploadCleanupError: ({ req, file, error }) =>
			logGateway2CoverLetterUploadCleanupFailed(service, req, file, error),
		redirect: redirectToFileUploaderQuestion
	});
	const deleteGateway2CoverLetter = createFileUploaderDeleteController({
		fieldName: GATEWAY_2_COVER_LETTER_FIELD,
		question: GATEWAY_2_COVER_LETTER_QUESTION,
		storage: fileUploaderStorage,
		onFilesChange: ({ req, uploadedFiles }) => {
			syncGateway2CoverLetterAnswer(req, uploadedFiles);
			logGateway2CoverLetterDeleted(service, req, uploadedFiles);
		},
		onDeleteError: ({ req, fileId, error }) => logGateway2CoverLetterDeleteFailed(service, req, fileId, error),
		redirect: redirectToFileUploaderQuestion
	});
	const deleteGateway2CoverLetterForCase = createFileUploaderDeleteController({
		fieldName: GATEWAY_2_COVER_LETTER_FIELD,
		question: GATEWAY_2_COVER_LETTER_QUESTION,
		storage: fileUploaderStorage,
		sessionKey: fileUploaderCaseSessionKey,
		onFilesChange: async ({ req, uploadedFiles }) => {
			await saveGateway2CoverLetterDocuments(service, req, uploadedFiles);
			syncGateway2CoverLetterAnswer(req, uploadedFiles);
			logGateway2CoverLetterDeleted(service, req, uploadedFiles);
		},
		onDeleteError: ({ req, fileId, error }) => logGateway2CoverLetterDeleteFailed(service, req, fileId, error),
		redirect: redirectToFileUploaderQuestion
	});
	const uploadLocalPlanTimetable = createFileUploaderUploadController({
		fieldName: LOCAL_PLAN_TIMETABLE_FIELD,
		question: LOCAL_PLAN_TIMETABLE_QUESTION,
		storage: fileUploaderStorage,
		destination: (req) => ({
			folderPath: `${req.sessionID ?? 'session'}/${LOCAL_PLAN_TIMETABLE_URL}`,
			metadata: {
				journeyId: JOURNEY_ID,
				fieldName: LOCAL_PLAN_TIMETABLE_FIELD
			}
		}),
		onFilesChange: ({ req, uploadedFiles }) => {
			syncLocalPlanTimetableAnswer(req, uploadedFiles);
			logLocalPlanTimetableUploaded(service, req, uploadedFiles);
		},
		onUploadError: ({ req, errors, error }) => logLocalPlanTimetableUploadFailed(service, req, { errors, error }),
		onUploadCleanupError: ({ req, file, error }) => logLocalPlanTimetableUploadCleanupFailed(service, req, file, error),
		redirect: redirectToFileUploaderQuestion
	});
	const uploadLocalPlanTimetableForCase = createFileUploaderUploadController({
		fieldName: LOCAL_PLAN_TIMETABLE_FIELD,
		question: LOCAL_PLAN_TIMETABLE_QUESTION,
		storage: fileUploaderStorage,
		sessionKey: fileUploaderTimetableCaseSessionKey,
		destination: (req) => {
			const request = req as Gateway2Request;
			return {
				folderPath: `${request.currentCase?.id ?? req.params.planReference}/${LOCAL_PLAN_TIMETABLE_URL}`,
				metadata: {
					journeyId: JOURNEY_ID,
					caseId: request.currentCase?.id,
					caseReference: req.params.planReference,
					fieldName: LOCAL_PLAN_TIMETABLE_FIELD
				}
			};
		},
		onFilesChange: async ({ req, uploadedFiles }) => {
			await saveLocalPlanTimetableDocuments(service, req, uploadedFiles);
			syncLocalPlanTimetableAnswer(req, uploadedFiles);
			logLocalPlanTimetableUploaded(service, req, uploadedFiles);
		},
		onUploadError: ({ req, errors, error }) => logLocalPlanTimetableUploadFailed(service, req, { errors, error }),
		onUploadCleanupError: ({ req, file, error }) => logLocalPlanTimetableUploadCleanupFailed(service, req, file, error),
		redirect: redirectToFileUploaderQuestion
	});
	const deleteLocalPlanTimetable = createFileUploaderDeleteController({
		fieldName: LOCAL_PLAN_TIMETABLE_FIELD,
		question: LOCAL_PLAN_TIMETABLE_QUESTION,
		storage: fileUploaderStorage,
		onFilesChange: ({ req, uploadedFiles }) => {
			syncLocalPlanTimetableAnswer(req, uploadedFiles);
			logLocalPlanTimetableDeleted(service, req, uploadedFiles);
		},
		onDeleteError: ({ req, fileId, error }) => logLocalPlanTimetableDeleteFailed(service, req, fileId, error),
		redirect: redirectToFileUploaderQuestion
	});
	const deleteLocalPlanTimetableForCase = createFileUploaderDeleteController({
		fieldName: LOCAL_PLAN_TIMETABLE_FIELD,
		question: LOCAL_PLAN_TIMETABLE_QUESTION,
		storage: fileUploaderStorage,
		sessionKey: fileUploaderTimetableCaseSessionKey,
		onFilesChange: async ({ req, uploadedFiles }) => {
			await saveLocalPlanTimetableDocuments(service, req, uploadedFiles);
			syncLocalPlanTimetableAnswer(req, uploadedFiles);
			logLocalPlanTimetableDeleted(service, req, uploadedFiles);
		},
		onDeleteError: ({ req, fileId, error }) => logLocalPlanTimetableDeleteFailed(service, req, fileId, error),
		redirect: redirectToFileUploaderQuestion
	});

	// Dispatches to the correct upload controller based on the question URL.
	function dispatchUpload(handlers: Record<string, RequestHandler>): RequestHandler {
		return (req, res, next) => {
			const questionUrl = String(req.params.question);
			const handler = handlers[questionUrl];
			if (handler) return handler(req, res, next);
			return next();
		};
	}

	// Returns the correct session key based on the question URL for case-scoped routes.
	function caseSessionKeyForQuestion(req: Request) {
		if (req.params.question === LOCAL_PLAN_TIMETABLE_URL) {
			return fileUploaderTimetableCaseSessionKey(req);
		}
		return fileUploaderCaseSessionKey(req);
	}

	const FILE_UPLOADER_QUESTION_URLS = [GATEWAY_2_COVER_LETTER_URL, LOCAL_PLAN_TIMETABLE_URL];

	router.get('/gateway-2-submission', getJourneyResponse, getJourney, setAsEditingFromCya, buildList());

	router.post('/gateway-2-submission', getJourneyResponse, getJourney, saveToDatabase);

	router.get(
		'/:planReference/gateway-2-submission',
		getJourneyResponseFromCase,
		getJourney,
		setAsEditingFromCya,
		buildList()
	);

	router.post('/:planReference/gateway-2-submission', getJourneyResponseFromCase, getJourney, saveToDatabase);

	router.post(
		'/:planReference/gateway-2-submission/:section/:question/upload-documents',
		getJourneyResponseFromCase,
		getJourney,
		upload.array('files[]'),
		dispatchUpload({
			[GATEWAY_2_COVER_LETTER_URL]: uploadGateway2CoverLetterForCase,
			[LOCAL_PLAN_TIMETABLE_URL]: uploadLocalPlanTimetableForCase
		})
	);

	router.post(
		'/:planReference/gateway-2-submission/:section/:question/delete-document/:fileId',
		getJourneyResponseFromCase,
		getJourney,
		dispatchUpload({
			[GATEWAY_2_COVER_LETTER_URL]: deleteGateway2CoverLetterForCase,
			[LOCAL_PLAN_TIMETABLE_URL]: deleteLocalPlanTimetableForCase
		})
	);

	router.post(
		'/gateway-2-submission/:section/:question/upload-documents',
		getJourneyResponse,
		getJourney,
		upload.array('files[]'),
		dispatchUpload({
			[GATEWAY_2_COVER_LETTER_URL]: uploadGateway2CoverLetter,
			[LOCAL_PLAN_TIMETABLE_URL]: uploadLocalPlanTimetable
		})
	);

	router.post(
		'/gateway-2-submission/:section/:question/delete-document/:fileId',
		getJourneyResponse,
		getJourney,
		dispatchUpload({
			[GATEWAY_2_COVER_LETTER_URL]: deleteGateway2CoverLetter,
			[LOCAL_PLAN_TIMETABLE_URL]: deleteLocalPlanTimetable
		})
	);

	router.get(
		'/:planReference/gateway-2-submission/:section/:question{/:manageListAction/:manageListItemId/:manageListQuestion}',
		getJourneyResponseFromCase,
		getJourney,
		fileUploaderQuestionMiddleware({
			questionUrls: FILE_UPLOADER_QUESTION_URLS,
			sessionKey: caseSessionKeyForQuestion
		}),
		question
	);

	router.post(
		'/:planReference/gateway-2-submission/:section/:question{/:manageListAction/:manageListItemId/:manageListQuestion}',
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
			questionUrls: FILE_UPLOADER_QUESTION_URLS
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
