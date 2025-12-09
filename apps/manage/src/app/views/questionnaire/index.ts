/**
 * Questionnaire module exports
 */

import { Router as createRouter } from 'express';
import type { ManageService } from '#service';
import type { IRouter, Request, Response, NextFunction } from 'express';
import { asyncHandler } from '@pins/local-plans-lib/util/async-handler.ts';
import { buildGetJourney } from '@planning-inspectorate/dynamic-forms/src/middleware/build-get-journey.js';
import { buildGetJourneyResponseFromSession } from '@planning-inspectorate/dynamic-forms/src/lib/session-answer-store.js';
import type { JourneyResponse } from '@planning-inspectorate/dynamic-forms/src/journey/journey-response.js';
import { question, buildSave } from '@planning-inspectorate/dynamic-forms/src/controller.js';
import validate from '@planning-inspectorate/dynamic-forms/src/validator/validator.js';
import { validationErrorHandler } from '@planning-inspectorate/dynamic-forms/src/validator/validation-error-handler.js';
import {
	createQuestionnaireControllers,
	createDeleteConfirmController,
	createDeleteController,
	loadSubmissionData,
	createSaveToDatabase
} from './controller/index.ts';
import { EDIT_JOURNEY_ID, createEditJourney } from './core/index.ts';

/**
 * Creates and configures the questionnaire router with all routes and controllers.
 *
 * @param service - The manage service instance containing database and logger
 * @returns Configured Express router for questionnaire functionality
 */
export const createQuestionnaireRoutes = (service: ManageService): IRouter => {
	const router = createRouter({ mergeParams: true });
	const { listController, detailController } = createQuestionnaireControllers(service);
	const deleteConfirmController = createDeleteConfirmController(service);
	const deleteController = createDeleteController(service);

	// List and detail routes
	router.get('/', listController);
	router.get('/:id', detailController);

	// Delete routes
	router.get('/:id/delete', deleteConfirmController);
	router.post('/:id/delete', deleteController);

	// Middleware to load submission data and prepare for edit journey
	const prepareEditJourney = async (req: Request, res: Response, next: NextFunction) => {
		// Clear all form session data to prevent journey ID mismatch
		if (req.session?.forms) {
			delete req.session.forms;
		}

		// Load submission data and store in request
		const submissionData = await loadSubmissionData(req, service);
		if (submissionData) {
			req.submissionData = submissionData;
		}
		next();
	};

	// Apply preparation to all edit routes
	router.use('/:id/edit', asyncHandler(prepareEditJourney));

	// Edit routes with dynamic forms
	const getJourney = buildGetJourney((req: Request, journeyResponse: JourneyResponse) => {
		const submissionId = req.params.id;
		const hasSessionData = journeyResponse?.answers && Object.keys(journeyResponse.answers).length > 0;
		if (!hasSessionData && req.submissionData) {
			journeyResponse.answers = req.submissionData;
		}
		return createEditJourney(submissionId, journeyResponse, req);
	});
	const getJourneyResponse = buildGetJourneyResponseFromSession(EDIT_JOURNEY_ID);
	const saveToDatabase = createSaveToDatabase(service);

	router.get('/:id/edit/:section/:question', getJourneyResponse, getJourney, question);
	router.post(
		'/:id/edit/:section/:question',
		getJourneyResponse,
		getJourney,
		validate,
		validationErrorHandler,
		buildSave(saveToDatabase)
	);

	// No check-your-answers route for edit flow

	return router;
};

// Export main factory function
export { createQuestionnaireControllers } from './controller/index.ts';

// Export core services
export { createQuestionnaireService } from './core/index.ts';
export type { QuestionnaireDataService, QuestionnaireBusinessService } from './core/index.ts';

// Export data service
export { createQuestionnaireDataService } from './data/service.ts';

// Export types
export type {
	QuestionnaireSubmission,
	QuestionnaireListViewModel,
	QuestionnaireDetailViewModel,
	QuestionnaireDetailParams
} from './types.ts';

// Export test utilities for external testing
export {
	createMockLogger,
	createMockDb,
	createMockManageService,
	createMockRequest,
	createMockResponse,
	TEST_DATA
} from './test-utils.ts';
