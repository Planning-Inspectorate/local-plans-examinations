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
import type { PortalService } from '#service';
import type { IRouter, Request, Response } from 'express';
import { createJourney, createQuestions, JOURNEY_ID } from './core/index.ts';
import { createQuestionnaireControllers, createSaveController } from './controller/index.ts';

/**
 * Creates all necessary dependencies for questionnaire routing including
 * controllers, middleware, and handlers.
 *
 * @param service - The portal service instance
 * @returns Object containing all route dependencies
 */
const createDependencies = (service: PortalService) => {
	const questions = createQuestions();
	const controllers = createQuestionnaireControllers(service);
	const getJourney = buildGetJourney((req: Request, journeyResponse: unknown) =>
		createJourney(questions, journeyResponse as Record<string, any> | null | undefined, req)
	);
	const getJourneyResponse = buildGetJourneyResponseFromSession(JOURNEY_ID);
	const saveDataToSession = buildSaveDataToSession({ reqParam: undefined });
	const saveController = createSaveController(controllers.questionnaireService, service);

	return {
		controllers,
		getJourney,
		getJourneyResponse,
		saveDataToSession,
		saveController
	};
};

/**
 * Sets up dynamic form routes for individual questions.
 * Handles both GET (display) and POST (submit) requests for form sections.
 *
 * @param router - Express router instance
 * @param getJourneyResponse - Middleware to get journey response from session
 * @param getJourney - Middleware to build journey
 * @param saveDataToSession - Middleware to save form data to session
 */
const setupFormRoutes = (
	router: IRouter,
	getJourneyResponse: (req: Request, res: Response, next: () => void) => void,
	getJourney: (req: Request, res: Response, next: () => void) => void,
	saveDataToSession: (req: Request, res: Response, next: () => void) => void
) => {
	router.get('/:section/:question', getJourneyResponse, getJourney, question);
	router.post(
		'/:section/:question',
		getJourneyResponse,
		getJourney,
		validate,
		validationErrorHandler,
		buildSave(saveDataToSession)
	);
};

/**
 * Sets up routes for the check your answers page.
 * Handles both display and final submission of the questionnaire.
 *
 * @param router - Express router instance
 * @param getJourneyResponse - Middleware to get journey response from session
 * @param getJourney - Middleware to build journey
 * @param saveController - Controller to handle final submission
 */
const setupCheckAnswersRoutes = (
	router: IRouter,
	getJourneyResponse: (req: Request, res: Response, next: () => void) => void,
	getJourney: (req: Request, res: Response, next: () => void) => void,
	saveController: (req: Request, res: Response) => Promise<void>
) => {
	router.get(
		'/check-your-answers',
		getJourneyResponse,
		getJourney,
		(req, res, next) => {
			const sessionData = req.session?.questionnaires || {};
			if (sessionData.error) {
				res.locals.errorMessage = sessionData.error;
				delete sessionData.error;
			}
			if (next) next();
		},
		(req, res) => list(req, res)
	);
	router.post('/check-your-answers', getJourneyResponse, getJourney, asyncHandler(saveController));
};

/**
 * Configures all questionnaire routes including static pages,
 * dynamic form routes, and check answers functionality.
 *
 * @param router - Express router instance
 * @param deps - Route dependencies from createDependencies
 */
const setupRoutes = (router: IRouter, deps: ReturnType<typeof createDependencies>) => {
	const { controllers, getJourney, getJourneyResponse, saveDataToSession, saveController } = deps;

	// Static routes
	router.get('/', controllers.startJourney);
	router.get('/success', controllers.viewSuccessPage);

	// Dynamic form routes
	setupFormRoutes(router, getJourneyResponse, getJourney, saveDataToSession);

	// Check answers routes
	setupCheckAnswersRoutes(router, getJourneyResponse, getJourney, saveController);
};

/**
 * Creates and configures the complete questionnaire router with all routes,
 * middleware, and controllers for the dynamic forms system.
 *
 * @param service - The portal service instance containing database and logger
 * @returns Configured Express router for questionnaire functionality
 */
export const createQuestionnaireRoutes = (service: PortalService): IRouter => {
	const router = createRouter({ mergeParams: true });
	const dependencies = createDependencies(service);
	setupRoutes(router, dependencies);
	return router;
};
