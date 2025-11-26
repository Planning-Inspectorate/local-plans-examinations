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

// Builder for questionnaire routes with dynamic forms integration
class QuestionnaireRouteBuilder {
	private readonly service: PortalService;
	private readonly router = createRouter({ mergeParams: true });

	constructor(service: PortalService) {
		this.service = service;
	}

	build() {
		const dependencies = this.createDependencies();
		this.setupRoutes(dependencies);
		return this.router;
	}

	// Creates controllers, middleware, and handlers for questionnaire routes
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

	private setupCheckAnswersRoutes(getJourneyResponse: any, getJourney: any, saveController: any) {
		this.router.get('/check-your-answers', getJourneyResponse, getJourney, (req, res) => list(req, res, ''));
		this.router.post('/check-your-answers', getJourneyResponse, getJourney, asyncHandler(saveController));
	}
}

// Factory for complete questionnaire flow with dynamic forms
export const createQuestionnaireRoutes = (service: PortalService) => {
	return new QuestionnaireRouteBuilder(service).build();
};
