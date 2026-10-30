import type { PortalService } from '#service';
import { type NextFunction, type Request, type RequestHandler, type Response } from 'express';
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
	createGateway3Questions,
	GW3_FILE_UPLOAD_QUESTIONS,
	GW3_REQUIRED_FILE_UPLOAD_QUESTIONS
} from './questions.ts';
import {
	getDocumentSetIdsByFolderName,
	loadGateway3DocumentsByDocumentSetId,
	saveGateway3Documents
} from './documents.ts';
import { downloadGateway3Document } from './download.ts';
import { asyncHandler } from '@planning-inspectorate/core/util';
import {
	createFileUploaderDeleteController,
	createFileUploaderUploadController,
	fileUploaderQuestionMiddleware,
	type FileUploaderQuestionProps,
	type FileUploaderSession,
	type UploadedFile
} from '@pins/local-plans-lib/forms/custom-components/file-uploader/index.ts';
import type { CaseModel } from '@pins/local-plans-database/src/client/models/Case.ts';
import type { Gateway3InfoModel } from '@pins/local-plans-database/src/client/models/Gateway3Info.ts';
import { GATEWAY_3_STATUS, GATEWAY_3_DECISION_ID } from '@pins/local-plans-database/src/seed/static-data/ids/index.ts';
import { DOCUMENT_SET_ID } from '@pins/local-plans-database/src/seed/static-data/ids/document-set.ts';
import lusca from 'lusca';
import { STATUS, StatusTag } from '../../../types.ts';
import { setVirusScanViewLocals } from '@pins/local-plans-lib/forms/custom-components/file-uploader/virus-scan.ts';
import {
	isGateway3ResubmissionAwaitingSubmission,
	sortGateway3Submissions,
	type Gateway3SubmissionSummary
} from '#util/gateway-3-submission.ts';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Gateway3InfoWithSubmissions = Gateway3InfoModel & {
	submissions?: Gateway3SubmissionSummary[] | null;
};

type Gateway3ReportDocument = {
	guid: string;
	name: string;
	documentSetId: string;
	latestDocumentVersion: {
		originalFilename: string | null;
		fileName: string | null;
		dateCreated: Date | null;
		isDeleted: boolean;
	} | null;
};

type CaseWithGateway3Info = CaseModel & {
	gateway3Info?: Gateway3InfoWithSubmissions | null;
	documents?: Gateway3ReportDocument[];
};

type Gateway3Session = Request['session'] &
	FileUploaderSession & {
		editingFromCheckAnswers?: boolean;
		forms?: Record<string, unknown>;
	};

type Gateway3Request = Request & {
	currentCase?: CaseWithGateway3Info;
	session: Gateway3Session;
};

type Gateway3FileUploadQuestion = FileUploaderQuestionProps & {
	fieldName: string;
	url: string;
};

// ---------------------------------------------------------------------------
// File-upload question config lookup tables
// ---------------------------------------------------------------------------

const gateway3FileUploadQuestionConfigs = Object.values(GW3_FILE_UPLOAD_QUESTIONS) as Gateway3FileUploadQuestion[];

const gateway3RequiredFileUploadQuestionConfigs = Object.values(
	GW3_REQUIRED_FILE_UPLOAD_QUESTIONS
) as Gateway3FileUploadQuestion[];

const gateway3FileUploadQuestionUrls = gateway3FileUploadQuestionConfigs.map((q) => q.url);

const gateway3FileUploadQuestionsByUrl = new Map(gateway3FileUploadQuestionConfigs.map((q) => [q.url, q]));

// ---------------------------------------------------------------------------
// Shared Multer instance
// ---------------------------------------------------------------------------

const upload = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: Math.max(...gateway3FileUploadQuestionConfigs.map((q) => q.maxFileSizeBytes))
	}
});

// ---------------------------------------------------------------------------
// Route helpers
// ---------------------------------------------------------------------------

function getRoutePlanReference(req: Request): string | undefined {
	const planReference = Array.isArray(req.params.planReference)
		? req.params.planReference[0]
		: req.params.planReference;
	return planReference || undefined;
}

function getRouteQuestionUrl(req: Request): string | undefined {
	const questionUrl = Array.isArray(req.params.question) ? req.params.question[0] : req.params.question;
	return questionUrl || undefined;
}

function getRouteFileUploadQuestion(req: Request): Gateway3FileUploadQuestion {
	const questionUrl = getRouteQuestionUrl(req);
	const questionConfig = questionUrl ? gateway3FileUploadQuestionsByUrl.get(questionUrl) : undefined;
	if (!questionConfig) {
		throw new Error(`No Gateway 3 file upload question configured for "${questionUrl ?? ''}"`);
	}
	return questionConfig;
}

function redirectToFileUploaderQuestion(req: Request) {
	const planReference = getRoutePlanReference(req);
	const planPath = planReference ? `/${encodeURIComponent(planReference)}` : '';
	return `${req.baseUrl}${planPath}/gateway-3-submission/${req.params.section}/${req.params.question}`;
}

function formatDisplayDate(date: Date | null | undefined) {
	if (!date) {
		return undefined;
	}
	return date.toLocaleDateString('en-GB', {
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	});
}

function formatDisplayTime(date: Date) {
	return date.toLocaleTimeString('en-GB', {
		hour: '2-digit',
		minute: '2-digit',
		hour12: false
	});
}

const DECLARATION_VIEW_PATH = 'views/manage-local-plans/gateway-3-submission/declaration/declaration.njk';
const SUBMITTED_TEMPLATE = 'views/manage-local-plans/gateway-3-submission/check-your-answers-submitted.njk';

function renderNotFound(res: Response) {
	return res.status(404).render('views/layouts/error', {
		pageTitle: 'Page not found',
		messages: [
			'If you typed the web address, check it is correct.',
			'If you pasted the web address, check you copied the entire address.'
		]
	});
}

// ---------------------------------------------------------------------------
// Session helpers
// ---------------------------------------------------------------------------

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

function getCaseScopedSessionAnswers(req: Request, planReference: string): Record<string, unknown> {
	const request = req as Gateway3Request;
	const planForms = asRecord(request.session.forms?.[planReference]);
	const answers = asRecord(planForms?.[JOURNEY_ID]);
	if (!answers) {
		return {};
	}
	return Object.fromEntries(
		Object.entries(answers).map(([key, value]) => [key, typeof value === 'boolean' ? (value ? 'yes' : 'no') : value])
	);
}

export function fileUploaderCaseSessionKey(req: Request) {
	const questionConfig = getRouteFileUploadQuestion(req);
	return fileUploaderCaseSessionKeyForField(req, questionConfig.fieldName);
}

export function fileUploaderCaseSessionKeyForField(req: Request, fieldName: string) {
	return `${req.params.planReference}:${fieldName}`;
}

function setFileUploaderUploadedFiles(req: Gateway3Request, sessionKey: string, uploadedFiles: UploadedFile[]) {
	req.session.fileUploader = {
		...req.session.fileUploader,
		[sessionKey]: {
			uploadedFiles
		}
	};
}

export function syncGateway3UploadAnswer(req: Request, fieldName: string, uploadedFiles: UploadedFile[]) {
	if (!req.session) {
		return;
	}
	const request = req as Gateway3Request;
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

// ---------------------------------------------------------------------------
// Gateway 3 status helpers
// ---------------------------------------------------------------------------

// Field name of the examination website question, which maps to the Gateway3Info.examinationWebsiteUrl database column.
const EXAMINATION_WEBSITE_FIELD = 'examinationWebsite';
async function saveGateway3AnswersToDatabase(service: PortalService, req: Request, answers: Record<string, unknown>) {
	const request = req as Gateway3Request;
	const caseId = request.currentCase?.id;
	if (!caseId || !Object.prototype.hasOwnProperty.call(answers, EXAMINATION_WEBSITE_FIELD)) {
		return;
	}

	const rawValue = answers[EXAMINATION_WEBSITE_FIELD];
	const examinationWebsiteUrl = typeof rawValue === 'string' && rawValue.trim().length > 0 ? rawValue.trim() : null;

	try {
		await service.db.gateway3Info.update({
			where: { caseId },
			data: { examinationWebsiteUrl }
		});
		if (request.currentCase?.gateway3Info) {
			request.currentCase.gateway3Info.examinationWebsiteUrl = examinationWebsiteUrl;
		}
	} catch (error) {
		service.logger.error(
			{ error, caseId, planReference: getRoutePlanReference(req) },
			'Failed to save Gateway 3 answers to the database'
		);
	}
}

async function markGateway3InProgress(service: PortalService, req: Request) {
	const request = req as Gateway3Request;
	const caseId = request.currentCase?.id;
	if (!caseId || request.currentCase?.gateway3Info?.frontOfficeStatus === GATEWAY_3_STATUS.IN_PROGRESS) {
		return;
	}

	try {
		await service.db.gateway3Info.update({
			where: { caseId },
			data: { frontOfficeStatus: GATEWAY_3_STATUS.IN_PROGRESS }
		});
		if (request.currentCase?.gateway3Info) {
			request.currentCase.gateway3Info.frontOfficeStatus = GATEWAY_3_STATUS.IN_PROGRESS;
		}
	} catch (error) {
		service.logger.error(
			{ error, caseId, planReference: getRoutePlanReference(req) },
			'Failed to set Gateway 3 status to IN_PROGRESS'
		);
	}
}

/** Determine whether a saved answer value represents a non-empty answer. */
function isNonEmptyAnswer(value: unknown): boolean {
	if (Array.isArray(value)) {
		return value.length > 0;
	}
	if (typeof value === 'string') {
		return value.trim().length > 0;
	}
	return value !== null && value !== undefined;
}

// ---------------------------------------------------------------------------
// Save-to-session for case-scoped answers
// ---------------------------------------------------------------------------

export function buildSaveDataToCase(service: PortalService): SaveDataFn {
	const saveDataToCaseSession = buildSaveDataToSession({ reqParam: 'planReference' });
	return async (params: SaveParams) => {
		await saveDataToCaseSession(params);

		const answers = (params.data?.answers ?? {}) as Record<string, unknown>;

		await saveGateway3AnswersToDatabase(service, params.req, answers);

		if (Object.values(answers).some(isNonEmptyAnswer)) {
			await markGateway3InProgress(service, params.req);
		}
	};
}

// ---------------------------------------------------------------------------
// View helpers
// ---------------------------------------------------------------------------

export function setGateway3ViewLocals(req: Request, res: Response) {
	const request = req as Gateway3Request;
	const planReference = getRoutePlanReference(req);
	const currentCase = request.currentCase;

	res.locals.pageTitle = 'Gateway 3 submission';
	res.locals.pageHeading = 'Gateway 3 submission';
	res.locals.pageCaption = currentCase?.planTitle;

	const isUnderReview = Boolean(
		currentCase?.gateway3Info?.actualDate && !isGateway3ResubmissionAwaitingSubmission(currentCase.gateway3Info)
	);
	const isInProgress = currentCase?.gateway3Info?.frontOfficeStatus === GATEWAY_3_STATUS.IN_PROGRESS;

	if (isUnderReview) {
		res.locals.statusTag = StatusTag[STATUS.UnderReview];
	} else if (isInProgress) {
		res.locals.statusTag = StatusTag[STATUS.InProgress];
	} else {
		res.locals.statusTag = StatusTag[STATUS.ReadyToStart];
	}

	if (planReference) {
		const encodedPlanReference = encodeURIComponent(planReference);
		res.locals.backLinkUrl = `/manage-local-plans/${encodedPlanReference}`;
		res.locals.saveAndComeBackUrl = `/manage-local-plans/${encodedPlanReference}`;
	}

	if (currentCase?.gateway3Info?.expectedDate) {
		res.locals.targetDate = formatDisplayDate(currentCase.gateway3Info.expectedDate);
	}

	setVirusScanViewLocals(
		res,
		gateway3FileUploadQuestionConfigs.map((questionConfig) => questionConfig.fieldName)
	);
}

export function setGateway3ViewData(req: Request, res: Response, next: NextFunction) {
	setGateway3ViewLocals(req, res);
	next();
}

export function buildSubmittedGateway3View(): RequestHandler {
	return (req, res, next) => {
		const request = req as Gateway3Request;
		const gateway3Info = request.currentCase?.gateway3Info;
		const actualDate = gateway3Info?.actualDate;

		if (!actualDate || isGateway3ResubmissionAwaitingSubmission(gateway3Info)) {
			return next();
		}

		const journey = res.locals.journey;
		if (journey) {
			journey.taskListTemplate = SUBMITTED_TEMPLATE;
		}

		res.locals.submissionDate = formatDisplayDate(actualDate);
		res.locals.submissionTime = formatDisplayTime(actualDate);
		res.locals.submitter = request.currentCase?.email;
		delete res.locals.saveAndComeBackUrl;

		// Build gateway 3 report file view data
		const planReference = getRoutePlanReference(req);
		const encodedPlanReference = planReference ? encodeURIComponent(planReference) : undefined;
		res.locals.gateway3ReportFiles = buildGateway3ReportFilesViewData(request.currentCase, encodedPlanReference);

		return next();
	};
}

export function buildGateway3ReportFilesViewData(
	currentCase: CaseWithGateway3Info | undefined,
	encodedPlanReference: string | undefined
) {
	const submissions = sortGateway3Submissions(currentCase?.gateway3Info?.submissions ?? []);
	const documents = currentCase?.documents ?? [];

	// Find the latest completed submission that has a "proceed to examination" decision
	const completedSubmissionIndex = submissions.findIndex(
		(sub) => sub.decision === GATEWAY_3_DECISION_ID.PROCEED_TO_EXAMINATION && sub.completionDate
	);

	if (completedSubmissionIndex === -1) {
		return [];
	}

	const submissionNumber = completedSubmissionIndex + 1;
	const documentSetId = DOCUMENT_SET_ID[`G3_DOCUMENT_${submissionNumber}`];
	if (!documentSetId) {
		return [];
	}

	const reportDocs = documents.filter(
		(doc) => doc.documentSetId === documentSetId && doc.latestDocumentVersion && !doc.latestDocumentVersion.isDeleted
	);

	return reportDocs.map((doc) => {
		const version = doc.latestDocumentVersion;
		const rawFileName = version?.originalFilename ?? version?.fileName ?? doc.name;
		let fileName: string;
		try {
			fileName = decodeURIComponent(rawFileName);
		} catch {
			fileName = rawFileName;
		}

		return {
			fileName,
			href:
				encodedPlanReference && doc.guid
					? `/manage-local-plans/${encodedPlanReference}/gateway-3-submission/download-document/${encodeURIComponent(doc.guid)}`
					: undefined,
			sharedDate: formatDisplayDate(version?.dateCreated)
		};
	});
}

export function buildGateway3CheckAnswersList(): RequestHandler {
	return (req, res, next) => {
		const request = req as Gateway3Request;
		return buildList({
			pageCaption: request.currentCase?.planTitle
		})(req, res, next);
	};
}

// ---------------------------------------------------------------------------
// Logging helpers
// ---------------------------------------------------------------------------

function gateway3UploadLogContext(req: Request, questionConfig: Gateway3FileUploadQuestion) {
	const request = req as Gateway3Request;
	return {
		planReference: getRoutePlanReference(req),
		caseId: request.currentCase?.id,
		fieldName: questionConfig.fieldName,
		questionUrl: questionConfig.url
	};
}

function logGateway3Uploaded(
	service: PortalService,
	req: Request,
	questionConfig: Gateway3FileUploadQuestion,
	uploadedFiles: UploadedFile[]
) {
	service.logger.info(
		{ ...gateway3UploadLogContext(req, questionConfig), fileCount: uploadedFiles.length },
		'Gateway 3 document uploaded'
	);
}

function logGateway3UploadFailed(
	service: PortalService,
	req: Request,
	questionConfig: Gateway3FileUploadQuestion,
	{ errors, error }: { errors?: Array<{ text: string; href: string }>; error?: unknown }
) {
	const context = { ...gateway3UploadLogContext(req, questionConfig), errorCount: errors?.length ?? 0 };
	if (error) {
		service.logger.error({ ...context, error }, 'Gateway 3 document upload failed');
		return;
	}
	service.logger.warn(context, 'Gateway 3 document upload failed');
}

function logGateway3UploadCleanupFailed(
	service: PortalService,
	req: Request,
	questionConfig: Gateway3FileUploadQuestion,
	file: UploadedFile,
	error: unknown
) {
	service.logger.error(
		{ ...gateway3UploadLogContext(req, questionConfig), fileId: file.id, error },
		'Gateway 3 document upload cleanup failed'
	);
}

function logGateway3Deleted(
	service: PortalService,
	req: Request,
	questionConfig: Gateway3FileUploadQuestion,
	uploadedFiles: UploadedFile[]
) {
	service.logger.info(
		{
			...gateway3UploadLogContext(req, questionConfig),
			fileId: req.params.fileId,
			remainingFileCount: uploadedFiles.length
		},
		'Gateway 3 document deleted'
	);
}

function logGateway3DeleteFailed(
	service: PortalService,
	req: Request,
	questionConfig: Gateway3FileUploadQuestion,
	fileId: string,
	error: unknown
) {
	service.logger.error(
		{ ...gateway3UploadLogContext(req, questionConfig), fileId, error },
		'Gateway 3 document delete failed'
	);
}

// ---------------------------------------------------------------------------
// Check-answers redirect helpers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// File-upload route handler builder
// ---------------------------------------------------------------------------

function buildFileUploadRouteHandler(handlersByQuestionUrl: Map<string, RequestHandler>): RequestHandler {
	return (req, res, next) => {
		const questionUrl = getRouteQuestionUrl(req);
		const handler = questionUrl ? handlersByQuestionUrl.get(questionUrl) : undefined;
		if (!handler || typeof handler !== 'function') {
			return renderNotFound(res);
		}
		return handler(req, res, next);
	};
}

// ---------------------------------------------------------------------------
// Multer error handler
// ---------------------------------------------------------------------------

export function handleMulterFileSizeError(err: Error, req: Request, res: Response, next: NextFunction) {
	if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
		const questionUrl = getRouteQuestionUrl(req);
		const questionConfig = questionUrl ? gateway3FileUploadQuestionsByUrl.get(questionUrl) : undefined;
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

// ---------------------------------------------------------------------------
// Middleware: editing from check-your-answers
// ---------------------------------------------------------------------------

export function setAsEditingFromCya(req: Request, _: Response, next: NextFunction) {
	const request = req as Gateway3Request;
	request.session.editingFromCheckAnswers = true;
	next();
}

export function redirectAfterCyaEdit(req: Request, res: Response, next: NextFunction) {
	const request = req as Gateway3Request;
	const returnToCya = getCheckAnswersRedirect(req) ?? request.session.editingFromCheckAnswers === true;
	buildSave(saveDataToSession, returnToCya)(req, res, next);
}

export function redirectAfterCaseQuestionEdit(saveDataToCase: SaveDataFn) {
	return (req: Request, res: Response, next: NextFunction) => {
		const returnToCya = getCheckAnswersRedirect(req) ?? true;
		buildSave(saveDataToCase, returnToCya)(req, res, next);
	};
}

// ---------------------------------------------------------------------------
// Case-loading middleware
// ---------------------------------------------------------------------------

export function buildGetJourneyResponseFromCase(service: PortalService): RequestHandler {
	return async (req, res, next) => {
		const routePlanReference = getRoutePlanReference(req);
		if (!routePlanReference) {
			return renderNotFound(res);
		}

		const currentCase = await service.db.case.findUnique({
			where: { reference: routePlanReference },
			include: {
				gateway3Info: { include: { submissions: true } },
				documents: {
					where: {
						isDeleted: false,
						documentSetId: { startsWith: 'g3-document-' }
					},
					select: {
						guid: true,
						name: true,
						documentSetId: true,
						latestDocumentVersion: {
							select: {
								originalFilename: true,
								fileName: true,
								dateCreated: true,
								isDeleted: true
							}
						}
					}
				}
			}
		});

		if (!currentCase) {
			return renderNotFound(res);
		}

		const request = req as Gateway3Request;
		request.currentCase = currentCase as CaseWithGateway3Info;
		const answers = getCaseScopedSessionAnswers(req, routePlanReference);
		const documentSetIdsByFolderName = await getDocumentSetIdsByFolderName(
			service,
			gateway3FileUploadQuestionConfigs.map((q) => q.url)
		);

		for (const questionConfig of gateway3FileUploadQuestionConfigs) {
			const documentSetId = documentSetIdsByFolderName.get(questionConfig.url);
			if (!documentSetId) {
				throw new Error(
					`Missing document set reference data for "${questionConfig.url}". Run the database static seed.`
				);
			}

			const uploadedFiles = await loadGateway3DocumentsByDocumentSetId(service, currentCase.id, documentSetId);
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

		const examinationWebsiteUrl = currentCase.gateway3Info?.examinationWebsiteUrl;
		if (examinationWebsiteUrl) {
			answers[EXAMINATION_WEBSITE_FIELD] = examinationWebsiteUrl;
		} else {
			delete answers[EXAMINATION_WEBSITE_FIELD];
		}

		res.locals.journeyResponse = new JourneyResponse(JOURNEY_ID, currentCase.id, {
			...answers
		});

		return next();
	};
}

// ---------------------------------------------------------------------------
// Submission validation and declaration page
// ---------------------------------------------------------------------------

const GATEWAY_3_SUBMIT_ERROR = 'Add all required documents before submitting';

function hasRequiredQuestionAnswer(answers: Record<string, unknown>, fieldName: string) {
	const answer = answers[fieldName];
	if (Array.isArray(answer)) {
		return answer.length > 0;
	}
	if (typeof answer === 'string') {
		return answer.length > 0;
	}
	return false;
}

function hasAllRequiredAnswers(answers: Record<string, unknown>) {
	const requiredFieldNames = [
		'examinationWebsite',
		...gateway3RequiredFileUploadQuestionConfigs.map((q) => q.fieldName)
	];
	return requiredFieldNames.every((fieldName) => hasRequiredQuestionAnswer(answers, fieldName));
}

export function buildValidateGateway3Submission(): RequestHandler {
	return async (req, res, next) => {
		const journeyResponse = res.locals.journeyResponse as JourneyResponse | undefined;
		const answers = journeyResponse?.answers ?? {};

		if (hasAllRequiredAnswers(answers)) {
			return next();
		}

		res.status(400);
		res.locals.errors = {
			submit: {
				text: GATEWAY_3_SUBMIT_ERROR
			}
		};
		res.locals.errorSummary = [
			{
				text: GATEWAY_3_SUBMIT_ERROR,
				href: '#required-information'
			}
		];

		setGateway3ViewLocals(req, res);
		await buildGateway3CheckAnswersList()(req, res, next);
	};
}

export function buildGuardDeclarationPage(): RequestHandler {
	return (req, res, next) => {
		const journeyResponse = res.locals.journeyResponse as JourneyResponse | undefined;
		const answers = journeyResponse?.answers ?? {};

		if (hasAllRequiredAnswers(answers)) {
			return next();
		}

		const planReference = getRoutePlanReference(req);
		const encodedPlanReference = planReference ? encodeURIComponent(planReference) : '';
		return res.redirect(`/manage-local-plans/${encodedPlanReference}/gateway-3-submission`);
	};
}

export function buildGetDeclarationPage(): RequestHandler {
	return (req, res) => {
		const planReference = getRoutePlanReference(req);
		const encodedPlanReference = planReference ? encodeURIComponent(planReference) : undefined;
		const isResubmission = req.query.from === 'resubmission';
		const gateway3Url = encodedPlanReference
			? `/manage-local-plans/${encodedPlanReference}/${isResubmission ? 'gateway-3-resubmission' : 'gateway-3-submission'}`
			: undefined;

		return res.render(DECLARATION_VIEW_PATH, {
			pageTitle: "Are you sure you're ready to submit?",
			pageHeading: "Are you sure you're ready to submit?",
			backLinkUrl: gateway3Url,
			goBackUrl: gateway3Url
		});
	};
}

const SUBMISSION_COMPLETE_VIEW_PATH =
	'views/manage-local-plans/gateway-3-submission/declaration/submission-complete.njk';

export function buildPostDeclarationPage(service: PortalService): RequestHandler {
	return async (req, res) => {
		const request = req as Gateway3Request;
		const planReference = getRoutePlanReference(req);
		const encodedPlanReference = planReference ? encodeURIComponent(planReference) : undefined;
		const submissionDate = new Date();
		const caseId = request.currentCase?.id;

		if (!caseId) {
			service.logger.error(`No case loaded for Gateway 3 declaration submission ${planReference ?? ''}`);
			return res.status(500).send('No case found');
		}

		try {
			await service.db.$transaction([
				service.db.case.update({
					where: { id: caseId },
					data: { submissionDate }
				}),
				service.db.gateway3Info.update({
					where: { caseId },
					data: { actualDate: submissionDate }
				})
			]);
		} catch (error) {
			service.logger.error({ error }, `Failed to update Gateway 3 submission date for case ${planReference ?? ''}`);
			return res.status(500).send('Failed to record submission');
		}

		return res.redirect(`/manage-local-plans/${encodedPlanReference}/gateway-3-submission/submission-complete`);
	};
}

export function buildGetSubmissionCompletePage(): RequestHandler {
	return (req, res) => {
		const planReference = getRoutePlanReference(req);
		const encodedPlanReference = planReference ? encodeURIComponent(planReference) : undefined;

		return res.render(SUBMISSION_COMPLETE_VIEW_PATH, {
			pageTitle: 'Gateway 3 submission complete',
			pageHeading: 'Gateway 3 submission complete',
			planOverviewUrl: encodedPlanReference ? `/manage-local-plans/${encodedPlanReference}` : '/manage-local-plans'
		});
	};
}

// ---------------------------------------------------------------------------
// Build all route middleware — called once by index.ts
// ---------------------------------------------------------------------------

export function buildGateway3Middleware(service: PortalService) {
	const getJourneyResponse = buildGetJourneyResponseFromSession(JOURNEY_ID);
	const getJourney = buildGetJourney((req, journeyResponse) =>
		createJourney(req, journeyResponse, createGateway3Questions(getRoutePlanReference(req)))
	);
	const getJourneyResponseFromCase = asyncHandler(buildGetJourneyResponseFromCase(service));
	const saveDataToCase = buildSaveDataToCase(service);
	const fileUploaderStorage = () => service.createFileStorage(JOURNEY_ID);

	const uploadGateway3DocumentForCase = buildFileUploadRouteHandler(
		new Map(
			gateway3FileUploadQuestionConfigs.map((questionConfig) => [
				questionConfig.url,
				createFileUploaderUploadController({
					fieldName: questionConfig.fieldName,
					question: questionConfig,
					storage: fileUploaderStorage,
					sessionKey: fileUploaderCaseSessionKey,
					destination: (req) => {
						const request = req as Gateway3Request;
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
						await saveGateway3Documents(service, req, questionConfig.url, uploadedFiles);
						syncGateway3UploadAnswer(req, questionConfig.fieldName, uploadedFiles);
						if (uploadedFiles.length > 0) {
							await markGateway3InProgress(service, req);
						}
						logGateway3Uploaded(service, req, questionConfig, uploadedFiles);
					},
					onUploadError: ({ req, errors, error }) =>
						logGateway3UploadFailed(service, req, questionConfig, { errors, error }),
					onUploadCleanupError: ({ req, file, error }) =>
						logGateway3UploadCleanupFailed(service, req, questionConfig, file, error),
					redirect: redirectToFileUploaderQuestion
				})
			])
		)
	);

	const deleteGateway3DocumentForCase = buildFileUploadRouteHandler(
		new Map(
			gateway3FileUploadQuestionConfigs.map((questionConfig) => [
				questionConfig.url,
				createFileUploaderDeleteController({
					fieldName: questionConfig.fieldName,
					question: questionConfig,
					storage: fileUploaderStorage,
					sessionKey: fileUploaderCaseSessionKey,
					onFilesChange: async ({ req, uploadedFiles }) => {
						await saveGateway3Documents(service, req, questionConfig.url, uploadedFiles);
						syncGateway3UploadAnswer(req, questionConfig.fieldName, uploadedFiles);
						logGateway3Deleted(service, req, questionConfig, uploadedFiles);
					},
					onDeleteError: ({ req, fileId, error }) =>
						logGateway3DeleteFailed(service, req, questionConfig, fileId, error),
					redirect: redirectToFileUploaderQuestion
				})
			])
		)
	);

	const fileUploaderMiddlewareForCase = fileUploaderQuestionMiddleware({
		questionUrls: gateway3FileUploadQuestionUrls,
		sessionKey: fileUploaderCaseSessionKey
	});

	return {
		getJourneyResponse,
		getJourney,
		getJourneyResponseFromCase,
		saveDataToCase,
		upload,
		uploadGateway3DocumentForCase,
		deleteGateway3DocumentForCase,
		fileUploaderMiddlewareForCase,
		downloadGateway3Document: asyncHandler(downloadGateway3Document(service)),
		validate,
		validationErrorHandler,
		question,
		lusca,
		redirectAfterCaseQuestionEdit: redirectAfterCaseQuestionEdit(saveDataToCase),
		validateGateway3Submission: buildValidateGateway3Submission(),
		guardDeclarationPage: buildGuardDeclarationPage(),
		getDeclarationPage: buildGetDeclarationPage(),
		postDeclarationPage: buildPostDeclarationPage(service),
		getSubmissionCompletePage: buildGetSubmissionCompletePage()
	};
}
