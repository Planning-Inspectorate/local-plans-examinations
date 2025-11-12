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

export function createRoutes(service: PortalService): IRouter {
	const router = createRouter({ mergeParams: true });

	// Get the dynamic forms controllers
	const { getJourney, getJourneyResponse, saveDataToSession } = buildQuestionnaireControllers(service);

	// Start page - redirects to first question
	router.get('/', (req, res) => {
		// Redirect to the first question in the first section
		res.redirect(`${req.baseUrl}/personal/full-name`);
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
	router.get('/check-your-answers', getJourneyResponse, getJourney, asyncHandler(buildCheckAnswersController(service)));

	// Submit the questionnaire
	router.post(
		'/check-your-answers',
		getJourneyResponse,
		getJourney,
		asyncHandler(buildQuestionnaireCompleteController(service))
	);

	// Success page
	router.get('/success', asyncHandler(buildQuestionnaireCompleteController(service)));

	return router;
}
