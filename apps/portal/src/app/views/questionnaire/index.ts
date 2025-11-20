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

/**
 * Route builder class for questionnaire module
 *
 * Organizes and configures all questionnaire-related routes including
 * dynamic form routes, static pages, and submission handling.
 */
class QuestionnaireRouteBuilder {
	private readonly service: PortalService;
	private readonly router = createRouter({ mergeParams: true });

	/**
	 * Creates a new QuestionnaireRouteBuilder instance
	 *
	 * @param {PortalService} service - Portal service for dependency injection
	 */
	constructor(service: PortalService) {
		this.service = service;
	}

	/**
	 * Builds and configures the complete questionnaire router
	 *
	 * @returns {Router} Configured Express router with all questionnaire routes
	 */
	build() {
		const dependencies = this.createDependencies();
		this.setupRoutes(dependencies);
		return this.router;
	}

	/**
	 * Creates all dependencies needed for questionnaire routes
	 *
	 * @returns {Object} Dependencies object with controllers and middleware
	 * @private
	 */
	private createDependencies() {
		const questions = createQuestionnaireQuestions();
		const controllers = createQuestionnaireControllers(this.service);
		const getJourney = buildGetJourney((req: any, journeyResponse: any) =>
			createQuestionnaireJourney(questions, journeyResponse, req)
		);
		const getJourneyResponse = buildGetJourneyResponseFromSession(QUESTIONNAIRE_CONFIG.id);
		const saveDataToSession = buildSaveDataToSession();
		const saveController = createSaveController(controllers.questionnaireService, this.service);

		return { controllers, getJourney, getJourneyResponse, saveDataToSession, saveController };
	}

	/**
	 * Sets up all questionnaire routes using provided dependencies
	 *
	 * @param {Object} deps - Dependencies from createDependencies
	 * @private
	 */
	private setupRoutes(deps: ReturnType<QuestionnaireRouteBuilder['createDependencies']>) {
		const { controllers, getJourney, getJourneyResponse, saveDataToSession, saveController } = deps;

		// Static routes
		this.router.get('/', controllers.startJourney);
		this.router.get('/success', controllers.viewSuccessPage);

		// Dynamic form routes
		this.setupFormRoutes(getJourneyResponse, getJourney, saveDataToSession);

		// Check answers routes
		this.setupCheckAnswersRoutes(getJourneyResponse, getJourney, saveController);
	}

	/**
	 * Sets up dynamic form routes for individual questions
	 *
	 * @param {any} getJourneyResponse - Middleware to get journey from session
	 * @param {any} getJourney - Middleware to build journey object
	 * @param {any} saveDataToSession - Middleware to save form data
	 * @private
	 */
	private setupFormRoutes(getJourneyResponse: any, getJourney: any, saveDataToSession: any) {
		this.router.get('/:section/:question', getJourneyResponse, getJourney, question);
		this.router.post(
			'/:section/:question',
			getJourneyResponse,
			getJourney,
			validate,
			validationErrorHandler,
			buildSave(saveDataToSession)
		);
	}

	/**
	 * Sets up check answers and submission routes
	 *
	 * @param {any} getJourneyResponse - Middleware to get journey from session
	 * @param {any} getJourney - Middleware to build journey object
	 * @param {any} saveController - Controller for final submission
	 * @private
	 */
	private setupCheckAnswersRoutes(getJourneyResponse: any, getJourney: any, saveController: any) {
		this.router.get('/check-your-answers', getJourneyResponse, getJourney, (req, res) => list(req, res, ''));
		this.router.post('/check-your-answers', getJourneyResponse, getJourney, asyncHandler(saveController));
	}
}

/**
 * Creates and configures all questionnaire routes
 *
 * Sets up a complete questionnaire flow including:
 * - Start page
 * - Dynamic form questions with validation
 * - Check answers page
 * - Submission handling
 * - Success page
 *
 * @param {PortalService} service - Portal service for dependency injection
 * @returns {Router} Configured Express router for questionnaire module
 *
 * @example
 * ```typescript
 * const questionnaireRoutes = createQuestionnaireRoutes(service);
 * app.use('/questionnaire', questionnaireRoutes);
 * ```
 */
export const createQuestionnaireRoutes = (service: PortalService) => {
	return new QuestionnaireRouteBuilder(service).build();
};
