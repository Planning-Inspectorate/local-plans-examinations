/**
 * Questionnaire routing configuration
 * Handles all HTTP routes for the questionnaire flow
 * @module QuestionnaireRoutes
 */

import { Router as createRouter } from 'express';
import { asyncHandler } from '@pins/local-plans-lib/util/async-handler.ts';
import { buildSave, question } from '@planning-inspectorate/dynamic-forms/src/controller.js';
import validate from '@planning-inspectorate/dynamic-forms/src/validator/validator.js';
import { validationErrorHandler } from '@planning-inspectorate/dynamic-forms/src/validator/validation-error-handler.js';
import type { IRouter } from 'express';
import { QUESTIONNAIRE_CONFIG, type PortalService } from './core/index.ts';
import { buildQuestionnaireMiddleware, buildCheckAnswersController, buildCompletionController } from './controllers.ts';

/**
 * Creates and configures all questionnaire routes
 * @param service - Portal service instance for logging and database operations
 * @returns Express router with all questionnaire routes configured
 */
export function createRoutes(service: PortalService): IRouter {
	const router = createRouter({ mergeParams: true });

	// Setup middleware
	const { getJourney, getJourneyResponse, saveDataToSession } = buildQuestionnaireMiddleware(service);

	// Start page
	router.get('/', (req, res) => {
		res.render(QUESTIONNAIRE_CONFIG.templates.start, {
			pageTitle: 'Local Plans Questionnaire',
			backLink: '/'
		});
	});

	// Question pages
	router.get('/:section/:question', getJourneyResponse, getJourney, asyncHandler(question));
	router.post(
		'/:section/:question',
		getJourneyResponse,
		getJourney,
		validate,
		validationErrorHandler,
		buildSave(saveDataToSession)
	);

	// Check your answers
	router.get(
		`/${QUESTIONNAIRE_CONFIG.routing.checkAnswers}`,
		getJourneyResponse,
		getJourney,
		asyncHandler(buildCheckAnswersController(service))
	);
	router.post(
		`/${QUESTIONNAIRE_CONFIG.routing.checkAnswers}`,
		getJourneyResponse,
		getJourney,
		asyncHandler(buildCompletionController(service))
	);

	// Success page
	router.get(`/${QUESTIONNAIRE_CONFIG.routing.success}`, asyncHandler(buildCompletionController(service)));

	return router;
}
