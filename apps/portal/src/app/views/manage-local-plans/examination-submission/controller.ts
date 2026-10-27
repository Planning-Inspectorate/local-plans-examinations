import type { PortalService } from '#service';
import { type NextFunction, type Request, type RequestHandler, type Response } from 'express';
import multer from 'multer';
import {
	buildGetJourney,
	buildList,
	buildSave,
	buildSaveDataToSession,
	JourneyResponse,
	question,
	type SaveDataFn,
	type SaveParams,
	validate,
	validationErrorHandler
} from '@planning-inspectorate/dynamic-forms';
import { asyncHandler } from '@planning-inspectorate/core/util';
import {
	createFileUploaderDeleteController,
	createFileUploaderUploadController,
	fileUploaderQuestionMiddleware,
	type FileUploaderQuestionProps,
	type FileUploaderSession,
	type UploadedFile
} from '@pins/local-plans-lib/forms/custom-components/file-uploader/index.ts';
import { DocumentUtil } from '@pins/local-plans-lib/util/documents.ts';
import { EXAMINATION_STATUS_ID } from '@pins/local-plans-database/src/seed/static-data/ids/index.ts';
import type { CaseModel } from '@pins/local-plans-database/src/client/models/Case.ts';
import lusca from 'lusca';
import { createJourney, JOURNEY_ID } from './journey.ts';
import {
	createExaminationQuestions,
	EXAMINATION_FILE_UPLOAD_QUESTIONS,
	EXAMINATION_REQUIRED_FILE_UPLOAD_QUESTIONS,
	REQUIRED_EXAMINATION_ITEM_TITLES
} from './questions.ts';

type ExaminationInfoRecord = {
	status: string;
	examinationWebsite: string | null;
	examinationWebsiteUrl: string | null;
	expectedSubmissionForExaminationDate: Date | null;
	submissionForExaminationDate: Date | null;
	statusLookup: { displayName: string } | null;
};

type CaseWithExaminationInfo = CaseModel & {
	examinationInfo?: ExaminationInfoRecord | null;
	gateway3Info?: { examinationWebsiteUrl: string | null } | null;
};

type ExaminationSession = Request['session'] &
	FileUploaderSession & {
		editingFromCheckAnswers?: boolean;
		forms?: Record<string, unknown>;
	};

type ExaminationRequest = Request & {
	currentCase?: CaseWithExaminationInfo;
	session: ExaminationSession;
};

type ExaminationFileUploadQuestion = FileUploaderQuestionProps & {
	fieldName: string;
	url: string;
	documentSetFolderName: string;
};

const fileUploadQuestionConfigs = Object.values(EXAMINATION_FILE_UPLOAD_QUESTIONS) as ExaminationFileUploadQuestion[];
const requiredFileUploadQuestionConfigs = Object.values(
	EXAMINATION_REQUIRED_FILE_UPLOAD_QUESTIONS
) as ExaminationFileUploadQuestion[];
const fileUploadQuestionUrls = fileUploadQuestionConfigs.map((questionConfig) => questionConfig.url);
const fileUploadQuestionsByUrl = new Map(
	fileUploadQuestionConfigs.map((questionConfig) => [questionConfig.url, questionConfig])
);

const upload = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: Math.max(...fileUploadQuestionConfigs.map((questionConfig) => questionConfig.maxFileSizeBytes))
	}
});

const STATUS_TAG_CLASSES: Record<string, string> = {
	[EXAMINATION_STATUS_ID.READY_TO_START]: 'govuk-tag govuk-tag--green',
	[EXAMINATION_STATUS_ID.IN_PROGRESS]: 'govuk-tag govuk-tag--blue',
	[EXAMINATION_STATUS_ID.SUBMITTED]: 'govuk-tag govuk-tag--yellow',
	[EXAMINATION_STATUS_ID.IN_EXAMINATION]: 'govuk-tag govuk-tag--blue',
	[EXAMINATION_STATUS_ID.PAUSED]: 'govuk-tag govuk-tag--grey',
	[EXAMINATION_STATUS_ID.REPORT_ISSUED]: 'govuk-tag govuk-tag--turquoise',
	[EXAMINATION_STATUS_ID.PLAN_ADOPTED]: 'govuk-tag govuk-tag--green'
};

const EXAMINATION_SUBMIT_ERROR = 'Add all required documents before you submit';
const DECLARATION_VIEW_PATH = 'views/manage-local-plans/examination-submission/declaration/declaration.njk';
const SUBMISSION_COMPLETE_VIEW_PATH =
	'views/manage-local-plans/examination-submission/declaration/submission-complete.njk';
const SUBMITTED_TEMPLATE = 'views/manage-local-plans/examination-submission/check-your-answers-submitted.njk';

const EDITABLE_EXAMINATION_STATUSES = new Set<string>([
	EXAMINATION_STATUS_ID.READY_TO_START,
	EXAMINATION_STATUS_ID.IN_PROGRESS
]);

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

function getPlanDetailsUrl(req: Request) {
	const planReference = getRoutePlanReference(req);
	return planReference ? `/manage-local-plans/${encodeURIComponent(planReference)}` : '/manage-local-plans';
}

function getExaminationSubmissionUrl(req: Request) {
	return `${getPlanDetailsUrl(req)}/examination`;
}

function formatDisplayDate(date: Date) {
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

function getRouteFileUploadQuestion(req: Request): ExaminationFileUploadQuestion {
	const questionUrl = getRouteQuestionUrl(req);
	const questionConfig = questionUrl ? fileUploadQuestionsByUrl.get(questionUrl) : undefined;
	if (!questionConfig) {
		throw new Error(`No examination file upload question configured for "${questionUrl ?? ''}"`);
	}
	return questionConfig;
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

function redirectToFileUploaderQuestion(req: Request) {
	const planReference = getRoutePlanReference(req);
	const planPath = planReference ? `/${encodeURIComponent(planReference)}` : '';
	return `${req.baseUrl}${planPath}/examination/${req.params.section}/${req.params.question}`;
}

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
	const request = req as ExaminationRequest;
	const planForms = asRecord(request.session.forms?.[planReference]);
	return asRecord(planForms?.[JOURNEY_ID]) ?? {};
}

function fileUploaderCaseSessionKey(req: Request) {
	return fileUploaderCaseSessionKeyForField(req, getRouteFileUploadQuestion(req).fieldName);
}

function fileUploaderCaseSessionKeyForField(req: Request, fieldName: string) {
	return `${req.params.planReference}:${JOURNEY_ID}:${fieldName}`;
}

function setFileUploaderUploadedFiles(req: ExaminationRequest, sessionKey: string, uploadedFiles: UploadedFile[]) {
	req.session.fileUploader = {
		...req.session.fileUploader,
		[sessionKey]: { uploadedFiles }
	};
}

function syncUploadAnswer(req: Request, fieldName: string, uploadedFiles: UploadedFile[]) {
	const request = req as ExaminationRequest;
	const planReference = getRoutePlanReference(req);
	if (!planReference) {
		return;
	}
	const forms = (request.session.forms ??= {});
	const answers = getOrCreateRecord(getOrCreateRecord(forms, planReference), JOURNEY_ID);
	if (uploadedFiles.length > 0) {
		answers[fieldName] = uploadedFiles;
	} else {
		delete answers[fieldName];
	}
}

function getCurrentCaseId(req: Request): string {
	const caseId = (req as ExaminationRequest).currentCase?.id;
	if (!caseId) {
		throw new Error('No case loaded for examination submission');
	}
	return caseId;
}

export async function markExaminationInProgress(service: PortalService, caseId: string) {
	await service.db.examinationInfo.update({
		where: { caseId },
		data: { status: EXAMINATION_STATUS_ID.IN_PROGRESS }
	});
}

export function buildSaveDataToCase(service: PortalService): SaveDataFn {
	const saveDataToCaseSession = buildSaveDataToSession({ reqParam: 'planReference' });
	return async (params: SaveParams) => {
		await saveDataToCaseSession(params);
		const examinationWebsiteUrl = params.data.answers?.examinationWebsiteUrl;
		if (typeof examinationWebsiteUrl !== 'string') {
			return;
		}
		await service.db.examinationInfo.upsert({
			where: { caseId: params.referenceId },
			create: {
				caseId: params.referenceId,
				examinationWebsiteUrl,
				status: EXAMINATION_STATUS_ID.IN_PROGRESS
			},
			update: {
				examinationWebsiteUrl,
				status: EXAMINATION_STATUS_ID.IN_PROGRESS
			}
		});
	};
}

export function setAsEditingFromCheckAnswers(req: Request, _: Response, next: NextFunction) {
	(req as ExaminationRequest).session.editingFromCheckAnswers = true;
	next();
}

export function setExaminationViewLocals(req: Request, res: Response) {
	const request = req as ExaminationRequest;
	const planReference = getRoutePlanReference(req);
	const currentCase = request.currentCase;

	res.locals.pageTitle = 'Examination';
	res.locals.pageHeading = 'Examination';
	res.locals.pageCaption = currentCase?.planTitle;
	res.locals.requiredItemTitles = REQUIRED_EXAMINATION_ITEM_TITLES;

	const examinationInfo = currentCase?.examinationInfo;
	if (examinationInfo?.expectedSubmissionForExaminationDate) {
		res.locals.targetDate = formatDisplayDate(examinationInfo.expectedSubmissionForExaminationDate);
	}
	if (examinationInfo && examinationInfo.status !== EXAMINATION_STATUS_ID.CANNOT_START_YET) {
		res.locals.statusTag = {
			label: examinationInfo.statusLookup?.displayName ?? examinationInfo.status,
			class: STATUS_TAG_CLASSES[examinationInfo.status] ?? 'govuk-tag govuk-tag--blue'
		};
	} else {
		delete res.locals.statusTag;
	}

	if (planReference) {
		const encodedPlanReference = encodeURIComponent(planReference);
		res.locals.backLinkUrl = `/manage-local-plans/${encodedPlanReference}`;
		res.locals.saveAndComeBackUrl = `/manage-local-plans/${encodedPlanReference}`;
	}
}

export function setExaminationViewData(req: Request, res: Response, next: NextFunction) {
	setExaminationViewLocals(req, res);
	next();
}

export function buildGuardExaminationAvailable(): RequestHandler {
	return (req, res, next) => {
		const status = (req as ExaminationRequest).currentCase?.examinationInfo?.status;
		if (status && status !== EXAMINATION_STATUS_ID.CANNOT_START_YET) {
			return next();
		}
		return res.redirect(getPlanDetailsUrl(req));
	};
}

export function buildGuardExaminationEdit(): RequestHandler {
	return (req, res, next) => {
		const status = (req as ExaminationRequest).currentCase?.examinationInfo?.status;
		if (status && EDITABLE_EXAMINATION_STATUSES.has(status)) {
			return next();
		}
		if (!status || status === EXAMINATION_STATUS_ID.CANNOT_START_YET) {
			return res.redirect(getPlanDetailsUrl(req));
		}
		return res.redirect(getExaminationSubmissionUrl(req));
	};
}

export function buildSubmittedExaminationView(): RequestHandler {
	return (req, res, next) => {
		const request = req as ExaminationRequest;
		const examinationInfo = request.currentCase?.examinationInfo;
		const submissionDate = examinationInfo?.submissionForExaminationDate;

		if (!examinationInfo || EDITABLE_EXAMINATION_STATUSES.has(examinationInfo.status)) {
			return next();
		}

		const journey = res.locals.journey;
		if (journey) {
			journey.taskListTemplate = SUBMITTED_TEMPLATE;
		}
		if (submissionDate) {
			res.locals.submissionDate = formatDisplayDate(submissionDate);
			res.locals.submissionTime = formatDisplayTime(submissionDate);
		}
		res.locals.submitter = request.currentCase?.email;
		delete res.locals.saveAndComeBackUrl;

		return next();
	};
}

export function buildExaminationCheckAnswersList(): RequestHandler {
	return (req, res, next) => {
		const request = req as ExaminationRequest;
		return buildList({
			pageCaption: request.currentCase?.planTitle,
			requiredItemTitles: REQUIRED_EXAMINATION_ITEM_TITLES
		})(req, res, next);
	};
}

export function buildGetJourneyResponseFromCase(service: PortalService): RequestHandler {
	return async (req, res, next) => {
		const planReference = getRoutePlanReference(req);
		if (!planReference) {
			return renderNotFound(res);
		}

		const currentCase = await service.db.case.findUnique({
			where: { reference: planReference },
			include: {
				examinationInfo: {
					include: { statusLookup: true }
				},
				gateway3Info: {
					select: { examinationWebsiteUrl: true }
				}
			}
		});
		if (!currentCase) {
			return renderNotFound(res);
		}

		const request = req as ExaminationRequest;
		request.currentCase = currentCase;
		const answers = getCaseScopedSessionAnswers(req, planReference);
		const savedExaminationWebsiteUrl = currentCase.examinationInfo?.examinationWebsiteUrl;
		const gateway3ExaminationWebsiteUrl = currentCase.gateway3Info?.examinationWebsiteUrl;
		if (!savedExaminationWebsiteUrl && gateway3ExaminationWebsiteUrl) {
			await service.db.examinationInfo.upsert({
				where: { caseId: currentCase.id },
				create: {
					caseId: currentCase.id,
					examinationWebsiteUrl: gateway3ExaminationWebsiteUrl
				},
				update: {
					examinationWebsiteUrl: gateway3ExaminationWebsiteUrl
				}
			});
		}
		const examinationWebsiteUrl =
			savedExaminationWebsiteUrl ?? gateway3ExaminationWebsiteUrl ?? currentCase.examinationInfo?.examinationWebsite;
		if (examinationWebsiteUrl) {
			answers.examinationWebsiteUrl = examinationWebsiteUrl;
		}

		const documentSetIdsByFolderName = await DocumentUtil.getDocumentSetIdsByFolderName(
			service,
			fileUploadQuestionConfigs.map((questionConfig) => questionConfig.documentSetFolderName)
		);
		for (const questionConfig of fileUploadQuestionConfigs) {
			const documentSetId = documentSetIdsByFolderName.get(questionConfig.documentSetFolderName);
			if (!documentSetId) {
				throw new Error(`Missing document set reference data for "${questionConfig.documentSetFolderName}"`);
			}
			const uploadedFiles = await DocumentUtil.loadUploadedDocuments(service, currentCase.id, documentSetId);
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

		res.locals.journeyResponse = new JourneyResponse(JOURNEY_ID, currentCase.id, answers);
		return next();
	};
}

function hasAnswer(answers: Record<string, unknown>, fieldName: string) {
	const answer = answers[fieldName];
	return Array.isArray(answer) ? answer.length > 0 : typeof answer === 'string' && answer.length > 0;
}

function hasAllRequiredAnswers(answers: Record<string, unknown>) {
	return ['examinationWebsiteUrl', ...requiredFileUploadQuestionConfigs.map((question) => question.fieldName)].every(
		(fieldName) => hasAnswer(answers, fieldName)
	);
}

export function buildValidateExaminationSubmission(): RequestHandler {
	return async (req, res, next) => {
		const journeyResponse = res.locals.journeyResponse as JourneyResponse | undefined;
		if (hasAllRequiredAnswers(journeyResponse?.answers ?? {})) {
			return next();
		}

		res.status(400);
		res.locals.errors = { submit: { text: EXAMINATION_SUBMIT_ERROR } };
		res.locals.errorSummary = [{ text: EXAMINATION_SUBMIT_ERROR, href: '#examination-details' }];
		setExaminationViewLocals(req, res);
		await buildExaminationCheckAnswersList()(req, res, next);
	};
}

export function buildGuardDeclarationPage(): RequestHandler {
	return (req, res, next) => {
		const journeyResponse = res.locals.journeyResponse as JourneyResponse | undefined;
		if (hasAllRequiredAnswers(journeyResponse?.answers ?? {})) {
			return next();
		}
		return res.redirect(getExaminationSubmissionUrl(req));
	};
}

export function buildGetDeclarationPage(): RequestHandler {
	return (req, res) => {
		const examinationSubmissionUrl = getExaminationSubmissionUrl(req);
		return res.render(DECLARATION_VIEW_PATH, {
			pageTitle: "Are you sure you're ready to submit?",
			pageHeading: "Are you sure you're ready to submit?",
			backLinkUrl: examinationSubmissionUrl,
			goBackUrl: examinationSubmissionUrl
		});
	};
}

export function buildPostDeclarationPage(service: PortalService): RequestHandler {
	return async (req, res) => {
		const request = req as ExaminationRequest;
		const planReference = getRoutePlanReference(req);
		const caseId = request.currentCase?.id;
		if (!caseId) {
			service.logger.error(`No case loaded for examination declaration submission ${planReference ?? ''}`);
			return res.status(500).send('No case found');
		}

		const submissionDate = new Date();
		try {
			await service.db.examinationInfo.update({
				where: { caseId },
				data: {
					status: EXAMINATION_STATUS_ID.SUBMITTED,
					submissionForExaminationDate: submissionDate
				}
			});
		} catch (error) {
			service.logger.error({ error }, `Failed to record examination submission for case ${planReference ?? ''}`);
			return res.status(500).send('Failed to record submission');
		}

		return res.redirect(`${getExaminationSubmissionUrl(req)}/submission-complete`);
	};
}

export function buildGetSubmissionCompletePage(): RequestHandler {
	return (req, res) =>
		res.render(SUBMISSION_COMPLETE_VIEW_PATH, {
			pageTitle: 'Submission complete',
			pageHeading: 'Submission complete',
			planOverviewUrl: getPlanDetailsUrl(req)
		});
}

export function handleMulterFileSizeError(err: Error, req: Request, res: Response, next: NextFunction) {
	if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
		const questionConfig = fileUploadQuestionsByUrl.get(getRouteQuestionUrl(req) ?? '');
		const session = req.session as unknown as {
			errors?: Record<string, { msg: string }>;
			errorSummary?: Array<{ text: string; href: string }>;
		};
		session.errors = { 'upload-form': { msg: 'Errors encountered during file upload' } };
		session.errorSummary = [
			{
				text: `The selected file must be smaller than ${questionConfig?.maxFileSizeLabel ?? '250MB'}`,
				href: '#upload-form'
			}
		];
		return res.redirect(redirectToFileUploaderQuestion(req));
	}
	return next(err);
}

export function buildExaminationMiddleware(service: PortalService) {
	const getJourneyResponseFromCase = asyncHandler(buildGetJourneyResponseFromCase(service));
	const getJourney = buildGetJourney((req, journeyResponse) =>
		createJourney(req, journeyResponse, createExaminationQuestions(getRoutePlanReference(req)))
	);
	const saveDataToCase = buildSaveDataToCase(service);
	const fileStorage = () => service.createFileStorage(JOURNEY_ID);

	const uploadDocumentForCase = buildFileUploadRouteHandler(
		new Map(
			fileUploadQuestionConfigs.map((questionConfig) => [
				questionConfig.url,
				createFileUploaderUploadController({
					fieldName: questionConfig.fieldName,
					question: questionConfig,
					storage: fileStorage,
					sessionKey: fileUploaderCaseSessionKey,
					destination: (req) => {
						const request = req as ExaminationRequest;
						return {
							folderPath: `${request.currentCase?.id ?? req.params.planReference}/${questionConfig.documentSetFolderName}`,
							metadata: {
								journeyId: JOURNEY_ID,
								caseId: request.currentCase?.id,
								caseReference: req.params.planReference,
								fieldName: questionConfig.fieldName,
								documentSetFolderName: questionConfig.documentSetFolderName
							}
						};
					},
					onFilesChange: async ({ req, uploadedFiles }) => {
						await DocumentUtil.saveDocuments(service, req, questionConfig.documentSetFolderName, uploadedFiles);
						await markExaminationInProgress(service, getCurrentCaseId(req));
						syncUploadAnswer(req, questionConfig.fieldName, uploadedFiles);
					},
					redirect: redirectToFileUploaderQuestion
				})
			])
		)
	);

	const deleteDocumentForCase = buildFileUploadRouteHandler(
		new Map(
			fileUploadQuestionConfigs.map((questionConfig) => [
				questionConfig.url,
				createFileUploaderDeleteController({
					fieldName: questionConfig.fieldName,
					question: questionConfig,
					storage: fileStorage,
					sessionKey: fileUploaderCaseSessionKey,
					onFilesChange: async ({ req, uploadedFiles }) => {
						await DocumentUtil.saveDocuments(service, req, questionConfig.documentSetFolderName, uploadedFiles);
						await markExaminationInProgress(service, getCurrentCaseId(req));
						syncUploadAnswer(req, questionConfig.fieldName, uploadedFiles);
					},
					redirect: redirectToFileUploaderQuestion
				})
			])
		)
	);

	const fileUploaderMiddlewareForCase = fileUploaderQuestionMiddleware({
		questionUrls: fileUploadQuestionUrls,
		sessionKey: fileUploaderCaseSessionKey
	});

	return {
		getJourneyResponseFromCase,
		getJourney,
		upload,
		uploadDocumentForCase,
		deleteDocumentForCase,
		fileUploaderMiddlewareForCase,
		downloadDocument: asyncHandler(async (req: Request, res: Response) => {
			const documentId = req.params.documentId;
			if (!documentId || typeof documentId !== 'string') {
				throw new Error('Missing documentId for download');
			}
			await DocumentUtil.downloadDocumentToResponse(service, documentId, res);
		}),
		validate,
		validationErrorHandler,
		question,
		lusca,
		redirectAfterQuestionEdit: (req: Request, res: Response, next: NextFunction) =>
			buildSave(saveDataToCase, true)(req, res, next),
		validateExaminationSubmission: buildValidateExaminationSubmission(),
		guardExaminationAvailable: buildGuardExaminationAvailable(),
		guardExaminationEdit: buildGuardExaminationEdit(),
		guardDeclarationPage: buildGuardDeclarationPage(),
		getDeclarationPage: buildGetDeclarationPage(),
		postDeclarationPage: buildPostDeclarationPage(service),
		getSubmissionCompletePage: buildGetSubmissionCompletePage(),
		submittedExaminationView: buildSubmittedExaminationView()
	};
}
