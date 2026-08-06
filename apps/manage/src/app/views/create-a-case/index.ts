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
import { createJourney, JOURNEY_ID } from './journey.ts';
import { questions } from './questions.ts';
import { loadLpaOptions } from '../../lib/load-lpa-options.ts';
import { buildSaveController } from './save.ts';
import { asyncHandler } from '@pins/local-plans-lib/util/async-handler.ts';
import { buildCaseOfficerOptions } from '../../util/options-helper.ts';

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

async function buildLpaOptions() {
	return asyncHandler(async (req: any, res: Response, next: NextFunction) => {
		const loaded = await loadLpaOptions();
		if (loaded.length > 0) {
			questions.lpa.options = [{ value: '', text: '' }, ...loaded];
		}

		next();
	});
}

export function createACaseRoutes(service: ManageService): IRouter {
	const router = createRouter({ mergeParams: true });

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
		buildCaseOfficerOptions(service, questions),
		getJourney,
		setAsEditingFromCya,
		setBackLinkFromSession,
		buildList()
	);

	router.post(
		'/check-your-answers',
		getJourneyResponse,
		buildCaseOfficerOptions(service, questions),
		buildLpaOptions,
		getJourney,
		saveToDatabase
	);

	router.get(
		'/:section/:question{/:manageListAction/:manageListItemId/:manageListQuestion}',
		getJourneyResponse,
		buildCaseOfficerOptions(service, questions),
		buildLpaOptions,
		getJourney,
		question
	);

	router.post(
		'/:section/:question{/:manageListAction/:manageListItemId/:manageListQuestion}',
		getJourneyResponse,
		buildCaseOfficerOptions(service, questions),
		buildLpaOptions,
		getJourney,
		validate,
		validationErrorHandler,
		saveLastQuestionUrl,
		redirectAfterCyaEdit
	);

	return router;
}
