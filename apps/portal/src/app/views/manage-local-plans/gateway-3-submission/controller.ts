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
	GW3_FILE_UPLOAD_QUESTIONS
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
import lusca from 'lusca';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CaseWithGateway3Info = CaseModel & { gateway3Info?: Gateway3InfoModel | null };

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
	return `${req.baseUrl}/${req.params.section}/${req.params.question}`;
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

function fileUploaderCaseSessionKey(req: Request) {
	const questionConfig = getRouteFileUploadQuestion(req);
	return fileUploaderCaseSessionKeyForField(req, questionConfig.fieldName);
}

function fileUploaderCaseSessionKeyForField(req: Request, fieldName: string) {
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
// Save-to-session for case-scoped answers
// ---------------------------------------------------------------------------

function buildSaveDataToCase(): SaveDataFn {
	const saveDataToCaseSession = buildSaveDataToSession({ reqParam: 'planReference' });
	return async (params: SaveParams) => {
		await saveDataToCaseSession(params);
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
	res.locals.statusTag = { label: 'Ready to start', class: 'govuk-tag govuk-tag--green' };

	if (planReference) {
		const encodedPlanReference = encodeURIComponent(planReference);
		res.locals.backLinkUrl = `/manage-local-plans/${encodedPlanReference}`;
		res.locals.saveAndComeBackUrl = `/manage-local-plans/${encodedPlanReference}`;
	}

	if (currentCase?.gateway3Info?.expectedDate) {
		res.locals.targetDate = formatDisplayDate(currentCase.gateway3Info.expectedDate);
	}
}

export function setGateway3ViewData(req: Request, res: Response, next: NextFunction) {
	setGateway3ViewLocals(req, res);
	next();
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
			include: { gateway3Info: true }
		});

		if (!currentCase) {
			return renderNotFound(res);
		}

		const request = req as Gateway3Request;
		request.currentCase = currentCase;
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

		res.locals.journeyResponse = new JourneyResponse(JOURNEY_ID, currentCase.id, {
			...answers
		});

		return next();
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
	const saveDataToCase = buildSaveDataToCase();
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
		redirectAfterCaseQuestionEdit: redirectAfterCaseQuestionEdit(saveDataToCase)
	};
}
