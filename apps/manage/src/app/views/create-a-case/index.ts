import type { ManageService } from '#service';
import { type IRouter, type NextFunction, type Response, Router as createRouter } from 'express';
import {
	buildGetJourney,
	buildGetJourneyResponseFromSession,
	buildList,
	buildSave,
	question,
	saveDataToSession,
	validate,
	validationErrorHandler
} from '@planning-inspectorate/dynamic-forms';
import { createJourney, JOURNEY_ID, loadJourneyOptions } from './journey.ts';
import { questions } from './questions.ts';
import { buildSaveController } from './save.ts';
import { asyncHandler } from '@planning-inspectorate/core/util';

function setAsEditingFromCya(req: any, _: any, next: any) {
	req.session.editingFromCheckAnswers = true;
	next();
}

export function shouldReturnToCya(req: { params?: Record<string, string | undefined> }, editingFromCya: boolean) {
	const hasManageListItemParams =
		req.params?.manageListAction || req.params?.manageListItemId || req.params?.manageListQuestion;
	return editingFromCya && !hasManageListItemParams;
}

function redirectAfterCyaEdit(req: any, res: any, next: any) {
	const returnToCya = shouldReturnToCya(req, req.session.editingFromCheckAnswers === true);
	buildSave(saveDataToSession, returnToCya)(req, res, next);
}

function saveLastQuestionUrl(req: any, _: any, next: any) {
	req.session.lastQuestionUrl = req.originalUrl;
	next();
}

function setBackLinkFromSession(req: any, res: Response, next: NextFunction) {
	if (req.session.lastQuestionUrl) {
		res.locals.backLink = req.session.lastQuestionUrl;
	}
	next();
}

export function createACaseRoutes(service: ManageService): IRouter {
	const router = createRouter({ mergeParams: true });

	const loadOptions = asyncHandler(async (req: any, _res: Response, next: NextFunction) => {
		await loadJourneyOptions(service, req, questions);
		next();
	});

	router.use((req, _res, next) => {
		if (req.session) {
			req.session.currentJourney = JOURNEY_ID;
		}
		next();
	});

	// read answers from the session
	const getJourneyResponse = buildGetJourneyResponseFromSession(JOURNEY_ID);
	const getJourney = buildGetJourney((req, journeyResponse) => createJourney(req, journeyResponse, questions));
	const saveToDatabase = asyncHandler(buildSaveController(service));

	router.get(
		'/check-your-answers',
		getJourneyResponse,
		loadOptions,
		getJourney,
		setAsEditingFromCya,
		setBackLinkFromSession,
		buildList()
	);

	router.post('/check-your-answers', getJourneyResponse, loadOptions, getJourney, saveToDatabase);

	router.get(
		'/:section/:question{/:manageListAction/:manageListItemId/:manageListQuestion}',
		getJourneyResponse,
		loadOptions,
		getJourney,
		question
	);

	router.post(
		'/:section/:question{/:manageListAction/:manageListItemId/:manageListQuestion}',
		getJourneyResponse,
		loadOptions,
		getJourney,
		validate,
		validationErrorHandler,
		saveLastQuestionUrl,
		redirectAfterCyaEdit
	);

	return router;
}
