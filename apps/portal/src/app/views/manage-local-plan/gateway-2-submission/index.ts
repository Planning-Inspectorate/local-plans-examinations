import type { PortalService } from '#service';
import { type IRouter, type RequestHandler, Router as createRouter } from 'express';
import multer from 'multer';
import {
	buildGetJourney,
	buildGetJourneyResponseFromSession,
	buildList,
	buildSave,
	buildSaveDataToSession,
	JourneyResponse,
	question,
	saveDataToSession,
	validate,
	validationErrorHandler
} from '@planning-inspectorate/dynamic-forms';
import { createJourney, JOURNEY_ID } from './journey.ts';
import { CHECK_ANSWERS_REDIRECT_QUERY, CHECK_ANSWERS_REDIRECTS, questions } from './questions.ts';
import { buildSaveController } from './save.ts';
import { asyncHandler } from '@pins/local-plans-lib/util/async-handler.ts';
import {
	createFileUploaderDeleteController,
	createFileUploaderUploadController,
	fileUploaderQuestionMiddleware,
	type UploadedFile
} from '@pins/local-plans-lib/forms/custom-components/file-uploader/index.ts';

const GATEWAY_2_COVER_LETTER_FIELD = 'gateway2CoverLetter';
const GATEWAY_2_COVER_LETTER_URL = 'gateway-2-cover-letter';
const GATEWAY_2_COVER_LETTER_QUESTION = questions[GATEWAY_2_COVER_LETTER_FIELD].config;

const upload = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: GATEWAY_2_COVER_LETTER_QUESTION.maxFileSizeBytes,
		files: GATEWAY_2_COVER_LETTER_QUESTION.maxFilesPerUpload
	}
});

function setAsEditingFromCya(req: any, _: any, next: any) {
	req.session.editingFromCheckAnswers = true;
	next();
}

function redirectAfterCyaEdit(req: any, res: any, next: any) {
	const returnToCya = getCheckAnswersRedirect(req) ?? req.session.editingFromCheckAnswers === true;
	buildSave(saveDataToSession, returnToCya)(req, res, next);
}

function redirectAfterCaseQuestionEdit(saveDataToCase: ReturnType<typeof buildSaveDataToCase>) {
	return (req: any, res: any, next: any) => {
		const returnToCya = getCheckAnswersRedirect(req) ?? true;
		buildSave(saveDataToCase, returnToCya)(req, res, next);
	};
}

function getCheckAnswersRedirect(req: any): boolean | undefined {
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

function redirectToFileUploaderQuestion(req: any) {
	const planPath = req.params.planReference ? `/${req.params.planReference}` : '';
	return `${req.baseUrl}${planPath}/gateway-2-submission/${req.params.section}/${req.params.question}`;
}

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

		(req as any).currentCase = currentCase;
		res.locals.journeyResponse = new JourneyResponse(JOURNEY_ID, currentCase.id, {
			...getCaseScopedSessionAnswers(req, routePlanReference ?? planReference),
			planTitle: currentCase.planTitle,
			planDate: currentCase.gateway2Date
		});

		return next();
	};
}

function buildSaveDataToCase(service: PortalService) {
	const saveDataToCaseSession = buildSaveDataToSession({ reqParam: 'planReference' });

	return async (params: any) => {
		await saveDataToCaseSession(params);

		const planReference = getPlanReference(params.req);
		if (!planReference) {
			throw new Error('Invalid plan reference');
		}

		const updateData = buildCaseUpdateData(params.data?.answers ?? {});
		if (Object.keys(updateData).length === 0) {
			return;
		}

		await service.db.case.update({
			where: { reference: planReference },
			data: updateData
		});
	};
}

function buildCaseUpdateData(answers: Record<string, unknown>) {
	const updateData: Record<string, unknown> = {};

	if (Object.hasOwn(answers, 'planTitle')) {
		updateData.planTitle = String(answers.planTitle ?? '');
	}

	if (Object.hasOwn(answers, 'planDate')) {
		updateData.gateway2Date = normaliseOptionalDate(answers.planDate);
	}

	return updateData;
}

function normaliseOptionalDate(value: unknown): Date | null {
	if (value === null || value === undefined || value === '') {
		return null;
	}

	return value instanceof Date ? value : new Date(String(value));
}

function getCaseScopedSessionAnswers(req: any, planReference: string): Record<string, unknown> {
	const answers = req.session?.forms?.[planReference]?.[JOURNEY_ID];
	if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
		return {};
	}

	return Object.fromEntries(
		Object.entries(answers).map(([key, value]) => [key, typeof value === 'boolean' ? (value ? 'yes' : 'no') : value])
	);
}

function fileUploaderCaseSessionKey(req: any) {
	return `${req.params.planReference}:${GATEWAY_2_COVER_LETTER_FIELD}`;
}

export function syncGateway2CoverLetterAnswer(req: any, uploadedFiles: UploadedFile[]) {
	if (!req.session) {
		return;
	}

	const planReference = getRoutePlanReference(req);
	const forms = (req.session.forms ??= {});
	const answers = planReference ? ((forms[planReference] ??= {})[JOURNEY_ID] ??= {}) : (forms[JOURNEY_ID] ??= {});

	if (uploadedFiles.length > 0) {
		answers[GATEWAY_2_COVER_LETTER_FIELD] = uploadedFiles;
		return;
	}

	delete answers[GATEWAY_2_COVER_LETTER_FIELD];
}

function getRoutePlanReference(req: any): string | undefined {
	const planReference = Array.isArray(req.params.planReference)
		? req.params.planReference[0]
		: req.params.planReference;

	return planReference || undefined;
}

function getPlanReference(req: any): string | undefined {
	const planReference = getRoutePlanReference(req);
	return normalisePlanReferenceForLookup(planReference);
}

export function normalisePlanReferenceForLookup(planReference: string | undefined): string | undefined {
	if (!planReference) {
		return undefined;
	}

	if (/^PLAN-\d+$/.test(planReference)) {
		return planReference.replace('PLAN-', 'PLAN/');
	}

	return planReference;
}

function renderNotFound(res: any) {
	return res.status(404).render('views/layouts/error', {
		pageTitle: 'Page not found',
		messages: [
			'If you typed the web address, check it is correct.',
			'If you pasted the web address, check you copied the entire address.'
		]
	});
}

export function gateway2SubmissionRoutes(service: PortalService): IRouter {
	const router = createRouter({ mergeParams: true });

	// read answers from the session
	const getJourneyResponse = buildGetJourneyResponseFromSession(JOURNEY_ID);
	const getJourney = buildGetJourney((req, journeyResponse) => createJourney(req, journeyResponse, questions));
	const getJourneyResponseFromCase = asyncHandler(buildGetJourneyResponseFromCase(service));
	const saveToDatabase = asyncHandler(buildSaveController(service));
	const saveDataToCase = buildSaveDataToCase(service);
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
		onFilesChange: ({ req, uploadedFiles }) => syncGateway2CoverLetterAnswer(req, uploadedFiles),
		redirect: redirectToFileUploaderQuestion
	});
	const uploadGateway2CoverLetterForCase = createFileUploaderUploadController({
		fieldName: GATEWAY_2_COVER_LETTER_FIELD,
		question: GATEWAY_2_COVER_LETTER_QUESTION,
		storage: fileUploaderStorage,
		sessionKey: fileUploaderCaseSessionKey,
		destination: (req) => ({
			folderPath: `${(req as any).currentCase?.id ?? req.params.planReference}/${GATEWAY_2_COVER_LETTER_URL}`,
			metadata: {
				journeyId: JOURNEY_ID,
				caseId: (req as any).currentCase?.id,
				caseReference: req.params.planReference,
				fieldName: GATEWAY_2_COVER_LETTER_FIELD
			}
		}),
		onFilesChange: ({ req, uploadedFiles }) => syncGateway2CoverLetterAnswer(req, uploadedFiles),
		redirect: redirectToFileUploaderQuestion
	});
	const deleteGateway2CoverLetter = createFileUploaderDeleteController({
		fieldName: GATEWAY_2_COVER_LETTER_FIELD,
		question: GATEWAY_2_COVER_LETTER_QUESTION,
		storage: fileUploaderStorage,
		onFilesChange: ({ req, uploadedFiles }) => syncGateway2CoverLetterAnswer(req, uploadedFiles),
		redirect: redirectToFileUploaderQuestion
	});
	const deleteGateway2CoverLetterForCase = createFileUploaderDeleteController({
		fieldName: GATEWAY_2_COVER_LETTER_FIELD,
		question: GATEWAY_2_COVER_LETTER_QUESTION,
		storage: fileUploaderStorage,
		sessionKey: fileUploaderCaseSessionKey,
		onFilesChange: ({ req, uploadedFiles }) => syncGateway2CoverLetterAnswer(req, uploadedFiles),
		redirect: redirectToFileUploaderQuestion
	});

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
		uploadGateway2CoverLetterForCase
	);

	router.post(
		'/:planReference/gateway-2-submission/:section/:question/delete-document/:fileId',
		getJourneyResponseFromCase,
		getJourney,
		deleteGateway2CoverLetterForCase
	);

	router.post(
		'/gateway-2-submission/:section/:question/upload-documents',
		getJourneyResponse,
		getJourney,
		upload.array('files[]'),
		uploadGateway2CoverLetter
	);

	router.post(
		'/gateway-2-submission/:section/:question/delete-document/:fileId',
		getJourneyResponse,
		getJourney,
		deleteGateway2CoverLetter
	);

	router.get(
		'/:planReference/gateway-2-submission/:section/:question{/:manageListAction/:manageListItemId/:manageListQuestion}',
		getJourneyResponseFromCase,
		getJourney,
		fileUploaderQuestionMiddleware({
			questionUrls: [GATEWAY_2_COVER_LETTER_URL],
			sessionKey: fileUploaderCaseSessionKey
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
			questionUrls: [GATEWAY_2_COVER_LETTER_URL]
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
