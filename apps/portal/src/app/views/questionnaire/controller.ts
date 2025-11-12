import { buildGetJourney } from '@planning-inspectorate/dynamic-forms/src/middleware/build-get-journey.js';
import {
	buildGetJourneyResponseFromSession,
	buildSaveDataToSession
} from '@planning-inspectorate/dynamic-forms/src/lib/session-answer-store.js';
import { getQuestions } from './questions.ts';
import { createJourney, JOURNEY_ID } from './journey.ts';
import type { PortalService } from '#service';
import type { AsyncRequestHandler } from '@pins/local-plans-lib/util/async-handler.ts';
import type { QuestionnaireControllers, JourneyResponse, QuestionnaireAnswers } from './types.ts';
import type { Request, Response } from 'express';
import { QUESTIONNAIRE_CONFIG } from './config.ts';
import {
	QuestionnaireErrorHandler,
	JourneyError,
	SessionError,
	ValidationError,
	validateAnswerData,
	validateSessionData
} from './error-handling.ts';

export function buildQuestionnaireControllers(service: PortalService): QuestionnaireControllers {
	const errorHandler = new QuestionnaireErrorHandler(service);
	const questions = getQuestions();

	// Build the journey creation function with proper error handling
	const getJourney = buildGetJourney((req: Request, journeyResponse: JourneyResponse) => {
		try {
			validateSessionData(req);

			if (!journeyResponse) {
				throw new SessionError('Journey response not available');
			}

			if (!req.baseUrl.endsWith('/' + JOURNEY_ID)) {
				throw new JourneyError(`Invalid journey request for URL: ${req.baseUrl}`);
			}

			return createJourney(questions, journeyResponse, req);
		} catch (error) {
			if (error instanceof JourneyError || error instanceof SessionError) {
				throw error; // Re-throw our custom errors
			}

			errorHandler.logError(error as Error, {
				context: 'journey_creation',
				baseUrl: req.baseUrl,
				sessionId: req.sessionID
			});

			throw new JourneyError('Failed to initialize questionnaire. Please try again.');
		}
	});

	// Build session middleware
	const getJourneyResponse = buildGetJourneyResponseFromSession(JOURNEY_ID);
	const saveDataToSession = buildSaveDataToSession();

	return {
		getJourney,
		getJourneyResponse,
		saveDataToSession,
		questions
	};
}

export function buildCheckAnswersController(service: PortalService): AsyncRequestHandler {
	const errorHandler = new QuestionnaireErrorHandler(service);

	return async (req: Request, res: Response) => {
		try {
			validateSessionData(req);

			// Try to get answers from journey response first, fallback to session
			let answers: QuestionnaireAnswers = res.locals.journeyResponse?.answers || {};

			// If no answers from journey response, try getting from session directly
			if (!answers || Object.keys(answers).length === 0) {
				const sessionAnswers = req.session.forms?.[QUESTIONNAIRE_CONFIG.JOURNEY_ID] || {};
				if (Object.keys(sessionAnswers).length > 0) {
					answers = sessionAnswers;
				} else {
					// Redirect to questionnaire start instead of showing error page - better UX
					service.logger.info('No questionnaire data found, redirecting to start');
					return res.redirect('/questionnaire');
				}
			}

			validateAnswerData(answers);

			// Log the answers to console (TODO: Remove console.log in production)
			console.log('=== QUESTIONNAIRE ANSWERS ===');
			console.log(JSON.stringify(answers, null, 2));
			service.logger.info({ answers }, 'Check your answers page - displaying collected data');

			return res.render(QUESTIONNAIRE_CONFIG.TEMPLATES.CHECK_ANSWERS, {
				pageTitle: 'Check your answers',
				answers: answers
			});
		} catch (error) {
			errorHandler.handleError(error as Error, req, res, 'check_answers');
		}
	};
}

export function buildQuestionnaireCompleteController(service: PortalService): AsyncRequestHandler {
	const errorHandler = new QuestionnaireErrorHandler(service);

	return async (req: Request, res: Response) => {
		try {
			validateSessionData(req);

			// Try to get answers from journey response first, fallback to session
			let answers: QuestionnaireAnswers = res.locals.journeyResponse?.answers || {};

			// If no answers from journey response, try getting from session directly
			if (!answers || Object.keys(answers).length === 0) {
				const sessionAnswers = req.session.forms?.[QUESTIONNAIRE_CONFIG.JOURNEY_ID] || {};
				if (Object.keys(sessionAnswers).length > 0) {
					answers = sessionAnswers;
				} else {
					throw new ValidationError('No questionnaire data found. Please complete the questionnaire first.');
				}
			}

			validateAnswerData(answers);

			// Log completion (TODO: Remove console.log in production)
			console.log('=== QUESTIONNAIRE SUBMITTED ===');
			console.log(JSON.stringify(answers, null, 2));
			service.logger.info({ answers }, 'Questionnaire completed');

			// Safely clear the session data
			try {
				if (req.session.forms && req.session.forms[QUESTIONNAIRE_CONFIG.JOURNEY_ID]) {
					delete req.session.forms[QUESTIONNAIRE_CONFIG.JOURNEY_ID];
				}
			} catch (sessionError) {
				// Log but don't fail - session cleanup is not critical
				service.logger.warn({ error: sessionError }, 'Failed to clear session data');
			}

			return res.render(QUESTIONNAIRE_CONFIG.TEMPLATES.SUCCESS, {
				pageTitle: 'Questionnaire submitted'
			});
		} catch (error) {
			errorHandler.handleError(error as Error, req, res, 'questionnaire_complete');
		}
	};
}
