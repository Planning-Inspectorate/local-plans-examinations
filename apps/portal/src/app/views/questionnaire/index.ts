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
 * dynamic form routes, static pages, and submission handling. Implements
 * builder pattern for clean route configuration and dependency management.
 *
 * @example
 * ```typescript
 * const builder = new QuestionnaireRouteBuilder(portalService);
 * const router = builder.build();
 * app.use('/questionnaire', router);
 * ```
 */
class QuestionnaireRouteBuilder {
	private readonly service: PortalService;
	private readonly router = createRouter({ mergeParams: true });

	/**
	 * Creates a new QuestionnaireRouteBuilder instance
	 *
	 * Initializes the builder with portal service for dependency injection
	 * and creates a new Express router for route configuration.
	 *
	 * @param {PortalService} service - Portal service containing database, logger, and other dependencies
	 */
	constructor(service: PortalService) {
		this.service = service;
	}

	/**
	 * Builds and configures the complete questionnaire router
	 *
	 * Creates all necessary dependencies, configures route handlers,
	 * and returns a fully configured Express router ready for mounting.
	 *
	 * @returns {Router} Configured Express router with all questionnaire routes and middleware
	 *
	 * @example
	 * ```typescript
	 * const router = builder.build();
	 * // Router includes: GET /, GET /success, dynamic form routes, submission handling
	 * ```
	 */
	build() {
		const dependencies = this.createDependencies();
		this.setupRoutes(dependencies);
		return this.router;
	}

	/**
	 * Creates all dependencies needed for questionnaire routes
	 *
	 * Instantiates questions, controllers, middleware, and other dependencies
	 * required for the complete questionnaire routing system.
	 *
	 * @returns {Object} Dependencies object containing all route requirements
	 * @returns {Object} returns.controllers - Controller instances for static pages
	 * @returns {Function} returns.getJourney - Middleware for building dynamic forms journey
	 * @returns {Function} returns.getJourneyResponse - Middleware for retrieving session data
	 * @returns {Function} returns.saveDataToSession - Middleware for persisting form data
	 * @returns {Function} returns.saveController - Handler for final submission
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
	 * Configures static routes, dynamic form routes, and submission routes
	 * using the provided dependencies and middleware.
	 *
	 * @param {Object} deps - Dependencies object from createDependencies method
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
	 * Configures GET and POST routes for each question in the questionnaire
	 * with proper validation, error handling, and session management.
	 *
	 * @param {any} getJourneyResponse - Middleware to retrieve journey state from session
	 * @param {any} getJourney - Middleware to build dynamic forms journey object
	 * @param {any} saveDataToSession - Middleware to persist form data to session
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
	 * Configures routes for reviewing answers and final submission processing
	 * with proper validation and error handling.
	 *
	 * @param {any} getJourneyResponse - Middleware to retrieve journey state from session
	 * @param {any} getJourney - Middleware to build dynamic forms journey object
	 * @param {any} saveController - Async controller for processing final submission
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
 * Factory function that sets up a complete questionnaire flow including:
 * - Start page (GET /)
 * - Dynamic form questions with validation (GET/POST /:section/:question)
 * - Check answers page (GET/POST /check-your-answers)
 * - Submission handling with error recovery
 * - Success page (GET /success)
 *
 * Uses builder pattern internally for clean dependency management and route configuration.
 *
 * @param {PortalService} service - Portal service containing database, logger, and configuration
 * @returns {Router} Fully configured Express router ready for mounting at /questionnaire
 *
 * @example
 * ```typescript
 * const questionnaireRoutes = createQuestionnaireRoutes(portalService);
 * app.use('/questionnaire', questionnaireRoutes);
 *
 * // Available routes:
 * // GET  /questionnaire           - Start page
 * // GET  /questionnaire/success   - Success confirmation
 * // GET  /questionnaire/:section/:question - Individual questions
 * // POST /questionnaire/:section/:question - Question submissions
 * // GET  /questionnaire/check-your-answers - Review page
 * // POST /questionnaire/check-your-answers - Final submission
 * ```
 */
export const createQuestionnaireRoutes = (service: PortalService) => {
	return new QuestionnaireRouteBuilder(service).build();
};
