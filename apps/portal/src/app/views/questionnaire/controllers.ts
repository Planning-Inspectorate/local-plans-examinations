/**
 * Questionnaire request controllers
 * Handles HTTP requests for questionnaire functionality
 * @module QuestionnaireControllers
 */

import { buildGetJourney } from '@planning-inspectorate/dynamic-forms/src/middleware/build-get-journey.js';
import {
	buildGetJourneyResponseFromSession,
	buildSaveDataToSession
} from '@planning-inspectorate/dynamic-forms/src/lib/session-answer-store.js';
import {
	QUESTIONNAIRE_CONFIG,
	questionnaireService,
	type PortalService,
	type AsyncRequestHandler,
	type Request,
	type Response,
	type QuestionnaireAnswers
} from './core/index.ts';

/**
 * Creates questionnaire middleware for dynamic forms integration
 * @param service - Portal service instance
 * @returns Middleware functions for journey handling and session management
 */
export function buildQuestionnaireMiddleware(service: PortalService) {
	const { logger } = service;
	const questions = questionnaireService.createQuestions();

	const getJourney = buildGetJourney((req: Request, journeyResponse: any) => {
		try {
			return questionnaireService.createJourney(questions, journeyResponse, req);
		} catch (error) {
			logger.error({ error }, 'Error creating journey');
			throw error;
		}
	});

	return {
		getJourney,
		getJourneyResponse: buildGetJourneyResponseFromSession(QUESTIONNAIRE_CONFIG.id),
		saveDataToSession: buildSaveDataToSession(),
		questions
	};
}

/**
 * Creates controller for the check your answers page
 * @param service - Portal service instance
 * @returns Express request handler for displaying questionnaire summary
 */
export function buildCheckAnswersController(service: PortalService): AsyncRequestHandler {
	const { logger } = service;

	return async (req: Request, res: Response) => {
		try {
			// Get answers from session
			const answers: QuestionnaireAnswers = res.locals.journeyResponse?.answers || {};

			// Validate we have answers
			if (!answers || Object.keys(answers).length === 0) {
				logger.info('No questionnaire data found, redirecting to start');
				return res.redirect('/questionnaire');
			}

			// Get template configuration
			const templateConfig = questionnaireService.getTemplateConfig();

			// Log the answers
			logger.info(
				{
					answers,
					template: templateConfig.template,
					answerCount: Object.keys(answers).length
				},
				'Displaying check your answers page'
			);

			// Transform answers to template format
			const templateData = {
				pageTitle: 'Check your answers',
				...questionnaireService.transformToTaskList(answers)
			};

			// Render template
			return res.render(templateConfig.template, templateData);
		} catch (error) {
			logger.error({ error }, 'Error in check answers controller');
			return res.status(500).render('views/layouts/error.njk', {
				pageTitle: 'Something went wrong',
				errorMessage: 'There was a problem displaying your answers. Please try again.'
			});
		}
	};
}

/**
 * Creates controller for questionnaire completion and success page
 * @param service - Portal service instance
 * @returns Express request handler for form submission and success page display
 */
export function buildCompletionController(service: PortalService): AsyncRequestHandler {
	const { logger } = service;

	return async (req: Request, res: Response) => {
		try {
			// Handle GET requests to success page
			if (req.method === 'GET') {
				return res.render(QUESTIONNAIRE_CONFIG.templates.success, {
					pageTitle: 'Questionnaire submitted'
				});
			}

			// Handle POST requests (form submission)
			const answers: QuestionnaireAnswers = res.locals.journeyResponse?.answers || {};

			if (!answers || Object.keys(answers).length === 0) {
				logger.warn('Attempted to submit questionnaire without answers');
				return res.redirect('/questionnaire');
			}

			// Log completion
			logger.info(
				{
					answers,
					submissionTime: new Date().toISOString(),
					sessionId: req.sessionID,
					answerCount: Object.keys(answers).length
				},
				'Questionnaire submitted successfully'
			);

			// Clear session data
			try {
				if (req.session.forms && req.session.forms[QUESTIONNAIRE_CONFIG.id]) {
					delete req.session.forms[QUESTIONNAIRE_CONFIG.id];
				}
			} catch (sessionError) {
				logger.warn({ error: sessionError }, 'Failed to clear session data');
			}

			// Redirect to success page
			return res.redirect('/questionnaire/success');
		} catch (error) {
			logger.error({ error }, 'Error in completion controller');
			return res.status(500).render('views/layouts/error.njk', {
				pageTitle: 'Something went wrong',
				errorMessage: 'There was a problem submitting your questionnaire. Please try again.'
			});
		}
	};
}
