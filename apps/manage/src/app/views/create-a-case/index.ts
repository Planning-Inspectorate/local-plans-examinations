import { Router, Router as createRouter } from 'express';
import { getQuestions } from './questions.ts';
import {
	buildGetJourney,
	buildGetJourneyResponseFromSession,
	buildSave,
	list,
	question,
	redirectToUnansweredQuestion,
	saveDataToSession,
	validate,
	validationErrorHandler
} from '@planning-inspectorate/dynamic-forms';
import { createJourney, JOURNEY_ID } from './journey.ts';
import { asyncHandler } from '@pins/local-plans-lib/util/async-handler.ts';
import { buildSaveController } from './save.ts';
import { ManageService } from '#service';

export function createACaseRoutes(service: ManageService): Router {
	const router = createRouter({ mergeParams: true });
	const questions = getQuestions();
	const getJourney = buildGetJourney((req, journeyResponse) => createJourney(questions, journeyResponse, req));
	const getJourneyResponse = buildGetJourneyResponseFromSession(JOURNEY_ID);
	const saveController = buildSaveController(service);

	router.get('/', getJourneyResponse, getJourney, redirectToUnansweredQuestion());

	router.get('/:section/:question', getJourneyResponse, getJourney, question);

	router.post(
		'/:section/:question',
		getJourneyResponse,
		getJourney,
		validate,
		validationErrorHandler,
		buildSave(saveDataToSession)
	);

	router.get('/check-your-answers', getJourneyResponse, getJourney, (req, res) => list(req, res, '', {}));

	router.post('/check-your-answers', getJourneyResponse, getJourney, asyncHandler(saveController));

	router.get('/success', (req, res) => res.redirect('/'));

	return router;
}
