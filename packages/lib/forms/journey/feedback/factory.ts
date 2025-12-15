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
import { JOURNEY_ID } from './journey.ts';
import { createJourney } from './journey.ts';
import { EditController } from '../../core/edit-controller.ts';
import { RouterFactory } from '../../core/router-factory.ts';
import { FeedbackControllerInterface } from './controller.ts';
import { createFeedbackEditConfig } from './edit-config.ts';
import { createSections } from './sections.ts';
import { createCoreServices } from '../../core/factory-utils.ts';
import { createFormQuestions } from './questions.ts';
import type { BaseService } from '@pins/local-plans-lib/app/base-service.ts';

import type { FormRequest, FormResponse } from '../../core/types.ts';

/**
 * Creates feedback-specific portal form functionality
 */
export const createFeedbackPortalForm = (service: BaseService) => {
	const { dataService, businessService } = createCoreServices(service);
	const questions = createFormQuestions();
	const controllerInterface = new FeedbackControllerInterface(businessService, service.logger);

	// Create portal router with feedback-specific configuration
	const router = Router({ mergeParams: true });

	// Controllers
	const startController = controllerInterface.createStartController('views/feedback/templates/form-start.njk');
	const successController = controllerInterface.createSuccessController('views/feedback/templates/form-success.njk');
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
	router.get('/check-your-answers', getJourneyResponse, getJourney, (req: FormRequest, res: FormResponse) => {
		return list(req as any, res, 'Check your answers');
	});
	router.post('/check-your-answers', getJourneyResponse, getJourney, asyncHandler(saveController as any));

	return {
		router,
		dataService,
		businessService,
		questions,
		controllerInterface
	};
};

/**
 * Creates feedback-specific manage form functionality
 */
export const createFeedbackManageForm = (service: BaseService) => {
	const { dataService, businessService } = createCoreServices(service);
	const questions = createFormQuestions();
	const controllerInterface = new FeedbackControllerInterface(businessService, service.logger);
	const editConfig = createFeedbackEditConfig();
	const editController = new EditController(
		dataService,
		service.logger,
		questions,
		editConfig as any,
		createSections as any
	);

	const router = RouterFactory.createManageRouter(controllerInterface, editController, {
		listTemplate: 'views/feedback/templates/view.njk',
		detailTemplate: 'views/feedback/templates/detail.njk',
		deleteTemplate: 'views/feedback/templates/delete-confirm.njk',
		pageTitle: 'Feedback Submissions'
	});

	return {
		router,
		dataService,
		businessService,
		questions,
		controllerInterface
	};
};
