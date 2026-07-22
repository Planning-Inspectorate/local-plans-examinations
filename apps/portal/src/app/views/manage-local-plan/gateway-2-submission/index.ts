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
	gateway2LocalPlanTimetableQuestion,
	gateway2ProjectInitiationDocumentQuestion,
	questions
} from './questions.ts';
import { buildSaveController } from './save.ts';
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

const GATEWAY_2_LOCAL_PLAN_TIMETABLE_FIELD = 'gateway2LocalPlanTimetable';
const GATEWAY_2_LOCAL_PLAN_TIMETABLE_URL = 'local-plan-timetable';
const GATEWAY_2_LOCAL_PLAN_TIMETABLE_QUESTION = gateway2LocalPlanTimetableQuestion;

const GATEWAY_2_PROJECT_INITIATION_DOCUMENT_FIELD = 'gateway2ProjectInitiationDocument';
const GATEWAY_2_PROJECT_INITIATION_DOCUMENT_URL = 'project-initiation-document';
const GATEWAY_2_PROJECT_INITIATION_DOCUMENT_QUESTION = gateway2ProjectInitiationDocumentQuestion;

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
		fileSize: GATEWAY_2_COVER_LETTER_QUESTION.maxFileSizeBytes,
		files: GATEWAY_2_COVER_LETTER_QUESTION.maxFilesPerUpload
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

// Builds the URL for the project initiation document page after timetable upload.
function redirectToProjectInitiationDocument(req: Request) {
	const planPath = req.params.planReference ? `/${req.params.planReference}` : '';
	return `${req.baseUrl}${planPath}/gateway-2-submission/${req.params.section}/project-initiation-document`;
}

// Builds the URL for the draft statement of compliance page after PID upload.
function redirectToDraftStatementOfCompliance(req: Request) {
	const planPath = req.params.planReference ? `/${req.params.planReference}` : '';
	return `${req.baseUrl}${planPath}/gateway-2-submission/${req.params.section}/draft-statement-of-compliance`;
}

// Wraps multer upload to catch file size limit errors.
function uploadWithSizeErrorHandling(req: Request, res: Response, next: NextFunction) {
	upload.array('files[]')(req, res, (error: unknown) => {
		if (error && typeof error === 'object' && 'code' in error && error.code === 'LIMIT_FILE_SIZE') {
			const session = req as unknown as { session: FileUploaderSession & Record<string, unknown> };
			const errorMessage = `The selected file must be smaller than ${GATEWAY_2_COVER_LETTER_QUESTION.maxFileSizeLabel}`;
			session.session.errors = { 'upload-form': { msg: errorMessage } };
			session.session.errorSummary = [{ text: errorMessage, href: '#upload-form' }];
			return res.redirect(redirectToFileUploaderQuestion(req));
		}
		if (error) {
			return next(error);
		}
		return next();
	});
}

// Dispatches to the correct file uploader controller based on the question URL.
function selectFileUploader(
	coverLetterController: RequestHandler,
	timetableController: RequestHandler,
	pidController: RequestHandler
): RequestHandler {
	return (req, res, next) => {
		const questionUrl = Array.isArray(req.params.question) ? req.params.question[0] : req.params.question;
		if (questionUrl === GATEWAY_2_COVER_LETTER_URL) {
			return coverLetterController(req, res, next);
		} else if (questionUrl === GATEWAY_2_LOCAL_PLAN_TIMETABLE_URL) {
			return timetableController(req, res, next);
		} else if (questionUrl === GATEWAY_2_PROJECT_INITIATION_DOCUMENT_URL) {
			return pidController(req, res, next);
		}
		return next();
	};
}

// Dispatches to the correct case-scoped file uploader controller based on the question URL.
function selectFileUploaderForCase(
	coverLetterController: RequestHandler,
	timetableController: RequestHandler,
	pidController: RequestHandler
): RequestHandler {
	return selectFileUploader(coverLetterController, timetableController, pidController);
}

// Selects the correct case session key based on the question URL.
function selectFileUploaderCaseSessionKey(req: Request): string {
	if (req.params.question === GATEWAY_2_LOCAL_PLAN_TIMETABLE_URL) {
		return fileUploaderTimetableCaseSessionKey(req);
	}
	if (req.params.question === GATEWAY_2_PROJECT_INITIATION_DOCUMENT_URL) {
		return fileUploaderPidCaseSessionKey(req);
	}
	return fileUploaderCoverLetterCaseSessionKey(req);
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
		res.locals.journeyResponse = new JourneyResponse(JOURNEY_ID, currentCase.id, {
			...getCaseScopedSessionAnswers(req, routePlanReference ?? planReference)
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
function fileUploaderCoverLetterCaseSessionKey(req: Request) {
	return `${req.params.planReference}:${GATEWAY_2_COVER_LETTER_FIELD}`;
}

// Example format: LP-TEST-001:gateway2LocalPlanTimetable.
function fileUploaderTimetableCaseSessionKey(req: Request) {
	return `${req.params.planReference}:${GATEWAY_2_LOCAL_PLAN_TIMETABLE_FIELD}`;
}

// Example format: LP-TEST-001:gateway2ProjectInitiationDocument.
function fileUploaderPidCaseSessionKey(req: Request) {
	return `${req.params.planReference}:${GATEWAY_2_PROJECT_INITIATION_DOCUMENT_FIELD}`;
}

// Keeps the Gateway 2 cover letter answer in sync with uploaded files.
export function syncGateway2CoverLetterAnswer(req: Request, uploadedFiles: UploadedFile[]) {
	syncGateway2Answer(req, GATEWAY_2_COVER_LETTER_FIELD, uploadedFiles);
}

// Keeps the local plan timetable answer in sync with uploaded files.
export function syncGateway2LocalPlanTimetableAnswer(req: Request, uploadedFiles: UploadedFile[]) {
	syncGateway2Answer(req, GATEWAY_2_LOCAL_PLAN_TIMETABLE_FIELD, uploadedFiles);
}

// Keeps the project initiation document answer in sync with uploaded files.
export function syncGateway2ProjectInitiationDocumentAnswer(req: Request, uploadedFiles: UploadedFile[]) {
	syncGateway2Answer(req, GATEWAY_2_PROJECT_INITIATION_DOCUMENT_FIELD, uploadedFiles);
}

// Keeps a Gateway 2 answer in sync with uploaded files.
function syncGateway2Answer(req: Request, fieldName: string, uploadedFiles: UploadedFile[]) {
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

function gateway2LocalPlanTimetableLogContext(req: Request) {
	const request = req as Gateway2Request;
	return {
		planReference: getRoutePlanReference(req),
		caseId: request.currentCase?.id,
		fieldName: GATEWAY_2_LOCAL_PLAN_TIMETABLE_FIELD
	};
}

function logGateway2LocalPlanTimetableUploaded(service: PortalService, req: Request, uploadedFiles: UploadedFile[]) {
	service.logger.info(
		{
			...gateway2LocalPlanTimetableLogContext(req),
			fileCount: uploadedFiles.length
		},
		'Gateway 2 local plan timetable uploaded'
	);
}

function logGateway2LocalPlanTimetableUploadFailed(
	service: PortalService,
	req: Request,
	{ errors, error }: { errors?: Array<{ text: string; href: string }>; error?: unknown }
) {
	const context = {
		...gateway2LocalPlanTimetableLogContext(req),
		errorCount: errors?.length ?? 0
	};

	if (error) {
		service.logger.error({ ...context, error }, 'Gateway 2 local plan timetable upload failed');
		return;
	}

	service.logger.warn(context, 'Gateway 2 local plan timetable upload failed');
}

function logGateway2LocalPlanTimetableDeleted(service: PortalService, req: Request, uploadedFiles: UploadedFile[]) {
	service.logger.info(
		{
			...gateway2LocalPlanTimetableLogContext(req),
			fileId: req.params.fileId,
			remainingFileCount: uploadedFiles.length
		},
		'Gateway 2 local plan timetable deleted'
	);
}

function logGateway2LocalPlanTimetableDeleteFailed(
	service: PortalService,
	req: Request,
	fileId: string,
	error: unknown
) {
	service.logger.error(
		{
			...gateway2LocalPlanTimetableLogContext(req),
			fileId,
			error
		},
		'Gateway 2 local plan timetable delete failed'
	);
}

function gateway2ProjectInitiationDocumentLogContext(req: Request) {
	const request = req as Gateway2Request;
	return {
		planReference: getRoutePlanReference(req),
		caseId: request.currentCase?.id,
		fieldName: GATEWAY_2_PROJECT_INITIATION_DOCUMENT_FIELD
	};
}

function logGateway2ProjectInitiationDocumentUploaded(
	service: PortalService,
	req: Request,
	uploadedFiles: UploadedFile[]
) {
	service.logger.info(
		{
			...gateway2ProjectInitiationDocumentLogContext(req),
			fileCount: uploadedFiles.length
		},
		'Gateway 2 project initiation document uploaded'
	);
}

function logGateway2ProjectInitiationDocumentUploadFailed(
	service: PortalService,
	req: Request,
	{ errors, error }: { errors?: Array<{ text: string; href: string }>; error?: unknown }
) {
	const context = {
		...gateway2ProjectInitiationDocumentLogContext(req),
		errorCount: errors?.length ?? 0
	};

	if (error) {
		service.logger.error({ ...context, error }, 'Gateway 2 project initiation document upload failed');
		return;
	}

	service.logger.warn(context, 'Gateway 2 project initiation document upload failed');
}

function logGateway2ProjectInitiationDocumentDeleted(
	service: PortalService,
	req: Request,
	uploadedFiles: UploadedFile[]
) {
	service.logger.info(
		{
			...gateway2ProjectInitiationDocumentLogContext(req),
			fileId: req.params.fileId,
			remainingFileCount: uploadedFiles.length
		},
		'Gateway 2 project initiation document deleted'
	);
}

function logGateway2ProjectInitiationDocumentDeleteFailed(
	service: PortalService,
	req: Request,
	fileId: string,
	error: unknown
) {
	service.logger.error(
		{
			...gateway2ProjectInitiationDocumentLogContext(req),
			fileId,
			error
		},
		'Gateway 2 project initiation document delete failed'
	);
}

// Generates task list data from the journey's sections and questions.
function buildTaskListData(req: Request, res: Response, next: NextFunction) {
	const journey = res.locals.journey;
	if (!journey) {
		return next();
	}

	const taskListData: Array<{
		title: { text: string };
		hint?: { text: string };
		href?: string;
		uploadedFiles?: UploadedFile[];
		status: { text: string; html?: string };
	}> = [];

	for (const section of journey.sections) {
		for (const question of section.questions) {
			const isAnswered = question.isAnswered(journey.response);
			const planReference = req.params.planReference;
			const questionUrl = planReference
				? `${req.baseUrl}/${planReference}/gateway-2-submission/${section.segment}/${question.url}`
				: `${req.baseUrl}/gateway-2-submission/${section.segment}/${question.url}`;

			const answer = journey.response?.answers?.[question.fieldName];
			const uploadedFiles = Array.isArray(answer) ? (answer as UploadedFile[]) : [];

			taskListData.push({
				title: { text: question.title },
				href: questionUrl,
				uploadedFiles,
				status: isAnswered ? { text: 'Completed' } : { text: 'Not started' }
			});
		}
	}

	res.locals.taskListData = taskListData;
	next();
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
		redirect: redirectToFileUploaderQuestion
	});
	const uploadGateway2CoverLetterForCase = createFileUploaderUploadController({
		fieldName: GATEWAY_2_COVER_LETTER_FIELD,
		question: GATEWAY_2_COVER_LETTER_QUESTION,
		storage: fileUploaderStorage,
		sessionKey: fileUploaderCoverLetterCaseSessionKey,
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
		onFilesChange: ({ req, uploadedFiles }) => {
			syncGateway2CoverLetterAnswer(req, uploadedFiles);
			logGateway2CoverLetterUploaded(service, req, uploadedFiles);
		},
		onUploadError: ({ req, errors, error }) => logGateway2CoverLetterUploadFailed(service, req, { errors, error }),
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
		sessionKey: fileUploaderCoverLetterCaseSessionKey,
		onFilesChange: ({ req, uploadedFiles }) => {
			syncGateway2CoverLetterAnswer(req, uploadedFiles);
			logGateway2CoverLetterDeleted(service, req, uploadedFiles);
		},
		onDeleteError: ({ req, fileId, error }) => logGateway2CoverLetterDeleteFailed(service, req, fileId, error),
		redirect: redirectToFileUploaderQuestion
	});
	const uploadGateway2LocalPlanTimetable = createFileUploaderUploadController({
		fieldName: GATEWAY_2_LOCAL_PLAN_TIMETABLE_FIELD,
		question: GATEWAY_2_LOCAL_PLAN_TIMETABLE_QUESTION,
		storage: fileUploaderStorage,
		destination: (req) => ({
			folderPath: `${req.sessionID ?? 'session'}/${GATEWAY_2_LOCAL_PLAN_TIMETABLE_URL}`,
			metadata: {
				journeyId: JOURNEY_ID,
				fieldName: GATEWAY_2_LOCAL_PLAN_TIMETABLE_FIELD
			}
		}),
		onFilesChange: ({ req, uploadedFiles }) => {
			syncGateway2LocalPlanTimetableAnswer(req, uploadedFiles);
			logGateway2LocalPlanTimetableUploaded(service, req, uploadedFiles);
		},
		onUploadError: ({ req, errors, error }) =>
			logGateway2LocalPlanTimetableUploadFailed(service, req, { errors, error }),
		redirect: redirectToProjectInitiationDocument
	});
	const uploadGateway2LocalPlanTimetableForCase = createFileUploaderUploadController({
		fieldName: GATEWAY_2_LOCAL_PLAN_TIMETABLE_FIELD,
		question: GATEWAY_2_LOCAL_PLAN_TIMETABLE_QUESTION,
		storage: fileUploaderStorage,
		sessionKey: fileUploaderTimetableCaseSessionKey,
		destination: (req) => {
			const request = req as Gateway2Request;
			return {
				folderPath: `${request.currentCase?.id ?? req.params.planReference}/${GATEWAY_2_LOCAL_PLAN_TIMETABLE_URL}`,
				metadata: {
					journeyId: JOURNEY_ID,
					caseId: request.currentCase?.id,
					caseReference: req.params.planReference,
					fieldName: GATEWAY_2_LOCAL_PLAN_TIMETABLE_FIELD
				}
			};
		},
		onFilesChange: ({ req, uploadedFiles }) => {
			syncGateway2LocalPlanTimetableAnswer(req, uploadedFiles);
			logGateway2LocalPlanTimetableUploaded(service, req, uploadedFiles);
		},
		onUploadError: ({ req, errors, error }) =>
			logGateway2LocalPlanTimetableUploadFailed(service, req, { errors, error }),
		redirect: redirectToProjectInitiationDocument
	});
	const deleteGateway2LocalPlanTimetable = createFileUploaderDeleteController({
		fieldName: GATEWAY_2_LOCAL_PLAN_TIMETABLE_FIELD,
		question: GATEWAY_2_LOCAL_PLAN_TIMETABLE_QUESTION,
		storage: fileUploaderStorage,
		onFilesChange: ({ req, uploadedFiles }) => {
			syncGateway2LocalPlanTimetableAnswer(req, uploadedFiles);
			logGateway2LocalPlanTimetableDeleted(service, req, uploadedFiles);
		},
		onDeleteError: ({ req, fileId, error }) => logGateway2LocalPlanTimetableDeleteFailed(service, req, fileId, error),
		redirect: redirectToFileUploaderQuestion
	});
	const deleteGateway2LocalPlanTimetableForCase = createFileUploaderDeleteController({
		fieldName: GATEWAY_2_LOCAL_PLAN_TIMETABLE_FIELD,
		question: GATEWAY_2_LOCAL_PLAN_TIMETABLE_QUESTION,
		storage: fileUploaderStorage,
		sessionKey: fileUploaderTimetableCaseSessionKey,
		onFilesChange: ({ req, uploadedFiles }) => {
			syncGateway2LocalPlanTimetableAnswer(req, uploadedFiles);
			logGateway2LocalPlanTimetableDeleted(service, req, uploadedFiles);
		},
		onDeleteError: ({ req, fileId, error }) => logGateway2LocalPlanTimetableDeleteFailed(service, req, fileId, error),
		redirect: redirectToFileUploaderQuestion
	});
	const uploadGateway2ProjectInitiationDocument = createFileUploaderUploadController({
		fieldName: GATEWAY_2_PROJECT_INITIATION_DOCUMENT_FIELD,
		question: GATEWAY_2_PROJECT_INITIATION_DOCUMENT_QUESTION,
		storage: fileUploaderStorage,
		destination: (req) => ({
			folderPath: `${req.sessionID ?? 'session'}/${GATEWAY_2_PROJECT_INITIATION_DOCUMENT_URL}`,
			metadata: {
				journeyId: JOURNEY_ID,
				fieldName: GATEWAY_2_PROJECT_INITIATION_DOCUMENT_FIELD
			}
		}),
		onFilesChange: ({ req, uploadedFiles }) => {
			syncGateway2ProjectInitiationDocumentAnswer(req, uploadedFiles);
			logGateway2ProjectInitiationDocumentUploaded(service, req, uploadedFiles);
		},
		onUploadError: ({ req, errors, error }) =>
			logGateway2ProjectInitiationDocumentUploadFailed(service, req, { errors, error }),
		redirect: redirectToDraftStatementOfCompliance
	});
	const uploadGateway2ProjectInitiationDocumentForCase = createFileUploaderUploadController({
		fieldName: GATEWAY_2_PROJECT_INITIATION_DOCUMENT_FIELD,
		question: GATEWAY_2_PROJECT_INITIATION_DOCUMENT_QUESTION,
		storage: fileUploaderStorage,
		sessionKey: fileUploaderPidCaseSessionKey,
		destination: (req) => {
			const request = req as Gateway2Request;
			return {
				folderPath: `${request.currentCase?.id ?? req.params.planReference}/${GATEWAY_2_PROJECT_INITIATION_DOCUMENT_URL}`,
				metadata: {
					journeyId: JOURNEY_ID,
					caseId: request.currentCase?.id,
					caseReference: req.params.planReference,
					fieldName: GATEWAY_2_PROJECT_INITIATION_DOCUMENT_FIELD
				}
			};
		},
		onFilesChange: ({ req, uploadedFiles }) => {
			syncGateway2ProjectInitiationDocumentAnswer(req, uploadedFiles);
			logGateway2ProjectInitiationDocumentUploaded(service, req, uploadedFiles);
		},
		onUploadError: ({ req, errors, error }) =>
			logGateway2ProjectInitiationDocumentUploadFailed(service, req, { errors, error }),
		redirect: redirectToDraftStatementOfCompliance
	});
	const deleteGateway2ProjectInitiationDocument = createFileUploaderDeleteController({
		fieldName: GATEWAY_2_PROJECT_INITIATION_DOCUMENT_FIELD,
		question: GATEWAY_2_PROJECT_INITIATION_DOCUMENT_QUESTION,
		storage: fileUploaderStorage,
		onFilesChange: ({ req, uploadedFiles }) => {
			syncGateway2ProjectInitiationDocumentAnswer(req, uploadedFiles);
			logGateway2ProjectInitiationDocumentDeleted(service, req, uploadedFiles);
		},
		onDeleteError: ({ req, fileId, error }) =>
			logGateway2ProjectInitiationDocumentDeleteFailed(service, req, fileId, error),
		redirect: redirectToFileUploaderQuestion
	});
	const deleteGateway2ProjectInitiationDocumentForCase = createFileUploaderDeleteController({
		fieldName: GATEWAY_2_PROJECT_INITIATION_DOCUMENT_FIELD,
		question: GATEWAY_2_PROJECT_INITIATION_DOCUMENT_QUESTION,
		storage: fileUploaderStorage,
		sessionKey: fileUploaderPidCaseSessionKey,
		onFilesChange: ({ req, uploadedFiles }) => {
			syncGateway2ProjectInitiationDocumentAnswer(req, uploadedFiles);
			logGateway2ProjectInitiationDocumentDeleted(service, req, uploadedFiles);
		},
		onDeleteError: ({ req, fileId, error }) =>
			logGateway2ProjectInitiationDocumentDeleteFailed(service, req, fileId, error),
		redirect: redirectToFileUploaderQuestion
	});

	router.get(
		'/gateway-2-submission',
		getJourneyResponse,
		getJourney,
		setAsEditingFromCya,
		buildTaskListData,
		buildList()
	);

	router.post('/gateway-2-submission', getJourneyResponse, getJourney, saveToDatabase);

	router.get(
		'/:planReference/gateway-2-submission',
		getJourneyResponseFromCase,
		getJourney,
		setAsEditingFromCya,
		buildTaskListData,
		buildList()
	);

	router.post('/:planReference/gateway-2-submission', getJourneyResponseFromCase, getJourney, saveToDatabase);

	router.post(
		'/:planReference/gateway-2-submission/:section/:question/upload-documents',
		getJourneyResponseFromCase,
		getJourney,
		uploadWithSizeErrorHandling,
		selectFileUploaderForCase(
			uploadGateway2CoverLetterForCase,
			uploadGateway2LocalPlanTimetableForCase,
			uploadGateway2ProjectInitiationDocumentForCase
		)
	);

	router.post(
		'/:planReference/gateway-2-submission/:section/:question/delete-document/:fileId',
		getJourneyResponseFromCase,
		getJourney,
		selectFileUploaderForCase(
			deleteGateway2CoverLetterForCase,
			deleteGateway2LocalPlanTimetableForCase,
			deleteGateway2ProjectInitiationDocumentForCase
		)
	);

	router.post(
		'/gateway-2-submission/:section/:question/upload-documents',
		getJourneyResponse,
		getJourney,
		uploadWithSizeErrorHandling,
		selectFileUploader(
			uploadGateway2CoverLetter,
			uploadGateway2LocalPlanTimetable,
			uploadGateway2ProjectInitiationDocument
		)
	);

	router.post(
		'/gateway-2-submission/:section/:question/delete-document/:fileId',
		getJourneyResponse,
		getJourney,
		selectFileUploader(
			deleteGateway2CoverLetter,
			deleteGateway2LocalPlanTimetable,
			deleteGateway2ProjectInitiationDocument
		)
	);

	router.get(
		'/:planReference/gateway-2-submission/:section/draft-statement-of-compliance',
		getJourneyResponseFromCase,
		getJourney,
		(req, res) => {
			res.render('views/manage-local-plan/gateway-2-submission/draft-statement-of-compliance.njk');
		}
	);

	router.get(
		'/:planReference/gateway-2-submission/:section/:question',
		getJourneyResponseFromCase,
		getJourney,
		fileUploaderQuestionMiddleware({
			questionUrls: [
				GATEWAY_2_COVER_LETTER_URL,
				GATEWAY_2_LOCAL_PLAN_TIMETABLE_URL,
				GATEWAY_2_PROJECT_INITIATION_DOCUMENT_URL
			],
			sessionKey: selectFileUploaderCaseSessionKey
		}),
		question
	);

	router.get(
		'/:planReference/gateway-2-submission/:section/:question{/:manageListAction/:manageListItemId/:manageListQuestion}',
		getJourneyResponseFromCase,
		getJourney,
		fileUploaderQuestionMiddleware({
			questionUrls: [
				GATEWAY_2_COVER_LETTER_URL,
				GATEWAY_2_LOCAL_PLAN_TIMETABLE_URL,
				GATEWAY_2_PROJECT_INITIATION_DOCUMENT_URL
			],
			sessionKey: selectFileUploaderCaseSessionKey
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
			questionUrls: [
				GATEWAY_2_COVER_LETTER_URL,
				GATEWAY_2_LOCAL_PLAN_TIMETABLE_URL,
				GATEWAY_2_PROJECT_INITIATION_DOCUMENT_URL
			]
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
