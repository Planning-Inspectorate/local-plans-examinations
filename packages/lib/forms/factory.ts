/**
 * Factory functions to create complete form functionality
 * Uses unified interface to eliminate code duplication between apps
 */

import { createJourney } from './journey/feedback/index.ts';
import { createFeedbackPortalForm, createFeedbackManageForm } from './journey/feedback/factory.ts';
import type { RouteConfig } from './core/controller.ts';
import { createCoreServices, createControllerInterface } from './core/factory-utils.ts';
import type { BaseService } from '@pins/local-plans-lib/app/base-service.ts';
import type { FormRequest, FormResponse } from './core/types.ts';
import { Router } from 'express';
import { asyncHandler } from '@pins/local-plans-lib/util/async-handler.ts';
import { buildGetJourney } from '@planning-inspectorate/dynamic-forms/src/middleware/build-get-journey.js';
import { buildSave, list, question } from '@planning-inspectorate/dynamic-forms/src/controller.js';
import validate from '@planning-inspectorate/dynamic-forms/src/validator/validator.js';
import { validationErrorHandler } from '@planning-inspectorate/dynamic-forms/src/validator/validation-error-handler.js';
import {
	buildGetJourneyResponseFromSession,
	buildSaveDataToSession
} from '@planning-inspectorate/dynamic-forms/src/lib/session-answer-store.js';
import { JOURNEY_ID } from './journey/feedback/index.ts';

/**
 * Creates complete portal form functionality using feedback-specific implementation
 */
export const createPortalForm = (service: BaseService) => {
	return createFeedbackPortalForm(service);
};

/**
 * Creates complete manage form functionality using feedback-specific implementation
 */
export const createManageForm = (service: BaseService) => {
	return createFeedbackManageForm(service);
};

/**
 * Creates generic portal form functionality - for direct core usage
 */
export const createGenericPortalForm = (service: BaseService) => {
	const { dataService, businessService } = createCoreServices(service);
	const questions = {}; // Generic questions - implement as needed
	const routes = {
		baseRoute: '/form',
		checkAnswersRoute: '/form/check-your-answers',
		startRoute: '/form',
		successRoute: '/form/success',
		listRoute: '/form',
		itemsRoute: '/items'
	};
	const controllerInterface = createControllerInterface(businessService, service.logger, routes);

	// Create router with all routes configured
	const router = Router({ mergeParams: true });

	// Controllers
	const startController = controllerInterface.createStartController(
		'views/feedback/templates/form-start.njk',
		'Generic Form'
	);
	const successController = controllerInterface.createSuccessController(
		'views/feedback/templates/form-success.njk',
		'Form submitted successfully'
	);
	const saveController = controllerInterface.createSaveController();

	// Dynamic forms middleware
	const getJourney = buildGetJourney((req: FormRequest, journeyResponse: any) =>
		createJourney(questions, journeyResponse, req as any)
	);
	const getJourneyResponse = buildGetJourneyResponseFromSession(JOURNEY_ID);
	const saveDataToSession = buildSaveDataToSession({ reqParam: undefined });

	// Static routes
	router.get('/', startController);
	router.get('/success', successController);

	// Dynamic form routes
	router.get('/:section/:question', getJourneyResponse, getJourney, question);
	router.post(
		'/:section/:question',
		getJourneyResponse,
		getJourney,
		validate,
		validationErrorHandler,
		buildSave(saveDataToSession)
	);

	// Check answers routes
	router.get('/check-your-answers', getJourneyResponse, getJourney, (req: FormRequest, res: FormResponse) =>
		list(req as any, res)
	);
	router.post('/check-your-answers', getJourneyResponse, getJourney, asyncHandler(saveController));

	return {
		router,
		dataService,
		businessService,
		questions,
		controllerInterface
	};
};

/**
 * Creates base form functionality for custom implementations
 * Apps can use this when they need custom controller logic
 */
export const createBaseForm = (service: BaseService, routes?: RouteConfig) => {
	const services = createCoreServices(service);
	const questions = {}; // Generic questions - implement as needed
	const controllerInterface = routes
		? createControllerInterface(services.businessService, service.logger, routes)
		: createControllerInterface(services.businessService, service.logger, {
				baseRoute: '/form',
				checkAnswersRoute: '/form/check-your-answers',
				startRoute: '/form',
				successRoute: '/form/success',
				listRoute: '/form',
				itemsRoute: '/items'
			});

	return {
		dataService: services.dataService,
		businessService: services.businessService,
		questions,
		controllerInterface,
		createJourney: (response: any, req: FormRequest) => createJourney(questions, response, req as any)
	};
};

// Re-export feedback-specific factories for direct use
export { createFeedbackPortalForm, createFeedbackManageForm } from './journey/feedback/factory.ts';
