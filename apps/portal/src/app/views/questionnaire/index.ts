import { Router as createRouter } from 'express';
import { asyncHandler } from '@pins/local-plans-lib/util/async-handler.ts';
import { buildSave, question } from '@planning-inspectorate/dynamic-forms/src/controller.js';
import validate from '@planning-inspectorate/dynamic-forms/src/validator/validator.js';
import { validationErrorHandler } from '@planning-inspectorate/dynamic-forms/src/validator/validation-error-handler.js';
import {
	buildQuestionnaireControllers,
	buildCheckAnswersController,
	buildQuestionnaireCompleteController
} from './controller.ts';
import type { PortalService } from '#service';
import type { IRouter } from 'express';
import { QUESTIONNAIRE_CONFIG } from './config.ts';

export function createRoutes(service: PortalService): IRouter {
	const router = createRouter({ mergeParams: true });

	// Get the dynamic forms controllers
	const { getJourney, getJourneyResponse, saveDataToSession } = buildQuestionnaireControllers(service);

	// Start page - redirects to first question
	router.get('/', (req, res) => {
		// Redirect to the first question in the first section
		res.redirect(`${req.baseUrl}${QUESTIONNAIRE_CONFIG.ROUTES.FIRST_QUESTION}`);
	});

	// Question pages - section-based routing as per dynamic forms pattern
	router.get('/:section/:question', getJourneyResponse, getJourney, asyncHandler(question));

	router.post(
		'/:section/:question',
		getJourneyResponse,
		getJourney,
		validate,
		validationErrorHandler,
		buildSave(saveDataToSession)
	);

	// Check your answers page - using our custom controller
	router.get(
		`/${QUESTIONNAIRE_CONFIG.ROUTES.CHECK_YOUR_ANSWERS}`,
		getJourneyResponse,
		getJourney,
		asyncHandler(buildCheckAnswersController(service))
	);

	// Submit the questionnaire
	router.post(
		`/${QUESTIONNAIRE_CONFIG.ROUTES.CHECK_YOUR_ANSWERS}`,
		getJourneyResponse,
		getJourney,
		asyncHandler(buildQuestionnaireCompleteController(service))
	);

	// Success page
	router.get(`/${QUESTIONNAIRE_CONFIG.ROUTES.SUCCESS}`, asyncHandler(buildQuestionnaireCompleteController(service)));

	return router;
}
