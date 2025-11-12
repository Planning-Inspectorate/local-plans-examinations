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

export function buildQuestionnaireControllers(service: PortalService): QuestionnaireControllers {
	const { logger } = service;
	const questions = getQuestions();

	// Build the journey creation function
	const getJourney = buildGetJourney((req: Request, journeyResponse: JourneyResponse) => {
		try {
			return createJourney(questions, journeyResponse, req);
		} catch (error) {
			logger.error({ error }, 'Error creating journey');
			throw error;
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
	const { logger } = service;

	return async (req: Request, res: Response) => {
		try {
			const answers: QuestionnaireAnswers = res.locals.journeyResponse?.answers || {};

			// Log the answers to console
			console.log('=== QUESTIONNAIRE ANSWERS ===');
			console.log(JSON.stringify(answers, null, 2));
			logger.info({ answers }, 'Check your answers page - displaying collected data');

			// For now, render a simple page showing the answers
			return res.render('views/questionnaire/check-answers.njk', {
				pageTitle: 'Check your answers',
				answers: answers
			});
		} catch (error) {
			logger.error({ error }, 'Error in check answers controller');
			throw error;
		}
	};
}

export function buildQuestionnaireCompleteController(service: PortalService): AsyncRequestHandler {
	const { logger } = service;

	return async (req: Request, res: Response) => {
		try {
			const answers: QuestionnaireAnswers = res.locals.journeyResponse?.answers || {};

			console.log('=== QUESTIONNAIRE SUBMITTED ===');
			console.log(JSON.stringify(answers, null, 2));
			logger.info({ answers }, 'Questionnaire completed');

			// Clear the session data
			if (req.session.forms) {
				delete req.session.forms[JOURNEY_ID];
			}

			return res.render('views/questionnaire/success.njk', {
				pageTitle: 'Questionnaire submitted'
			});
		} catch (error) {
			logger.error({ error }, 'Error in questionnaire complete controller');
			throw error;
		}
	};
}
