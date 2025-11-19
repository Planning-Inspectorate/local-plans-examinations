import { Router as createRouter } from 'express';
import { asyncHandler } from '@pins/local-plans-lib/util/async-handler.ts';
import { buildGetJourney } from '@planning-inspectorate/dynamic-forms/src/middleware/build-get-journey.js';
import { buildSave, list, question } from '@planning-inspectorate/dynamic-forms/src/controller.js';
import validate from '@planning-inspectorate/dynamic-forms/src/validator/validator.js';
import { validationErrorHandler } from '@planning-inspectorate/dynamic-forms/src/validator/validation-error-handler.js';
import {
	buildGetJourneyResponseFromSession,
	buildSaveDataToSession
} from '@planning-inspectorate/dynamic-forms/src/lib/session-answer-store.js';
import { createQuestionnaireJourney } from './core/journey.ts';
import { createQuestionnaireQuestions } from './core/questions.ts';
import { createQuestionnaireControllers } from './controller.ts';
import { createSaveController } from './save.ts';
import { QUESTIONNAIRE_CONFIG } from './core/config.ts';
import type { PortalService } from '#service';

export const createQuestionnaireRoutes = (service: PortalService) => {
	const router = createRouter({ mergeParams: true });

	const questions = createQuestionnaireQuestions();
	const { startJourney, viewSuccessPage, questionnaireService } = createQuestionnaireControllers(service);

	const getJourney = buildGetJourney((req, journeyResponse) =>
		createQuestionnaireJourney(questions, journeyResponse, req)
	);
	const getJourneyResponse = buildGetJourneyResponseFromSession(QUESTIONNAIRE_CONFIG.id);
	const saveDataToSession = buildSaveDataToSession();
	const saveController = createSaveController(questionnaireService);

	router.get('/', startJourney);
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
	router.get('/success', viewSuccessPage);

	return router;
};
