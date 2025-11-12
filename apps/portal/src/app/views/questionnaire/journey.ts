import { Journey } from '@planning-inspectorate/dynamic-forms/src/journey/journey.js';
import { getQuestionnaireSections } from './sections.ts';
import type { QuestionMap, JourneyResponse } from './types.ts';
import type { Request } from 'express';
import { QUESTIONNAIRE_CONFIG } from './config.ts';
import { JourneyError } from './error-handling.ts';

export const JOURNEY_ID = QUESTIONNAIRE_CONFIG.JOURNEY_ID;

export function createJourney(questions: QuestionMap, response: JourneyResponse, req: Request): Journey {
	// Validate inputs
	if (!questions || Object.keys(questions).length === 0) {
		throw new JourneyError('Questions not properly initialized');
	}

	if (!response) {
		throw new JourneyError('Journey response not provided');
	}

	if (!req.baseUrl.endsWith('/' + JOURNEY_ID)) {
		throw new JourneyError(`Invalid journey request - expected URL ending with /${JOURNEY_ID}, got: ${req.baseUrl}`);
	}

	try {
		const sections = getQuestionnaireSections(questions);

		if (!sections || sections.length === 0) {
			throw new JourneyError('No questionnaire sections available');
		}

		return new Journey({
			journeyId: JOURNEY_ID,
			sections,
			taskListUrl: QUESTIONNAIRE_CONFIG.ROUTES.CHECK_YOUR_ANSWERS,
			journeyTemplate: QUESTIONNAIRE_CONFIG.TEMPLATES.FORMS_QUESTION,
			taskListTemplate: QUESTIONNAIRE_CONFIG.TEMPLATES.FORMS_CHECK_ANSWERS,
			journeyTitle: 'Local Plans Questionnaire',
			returnToListing: false,
			makeBaseUrl: () => req.baseUrl,
			initialBackLink: '/questionnaire',
			response
		});
	} catch (error) {
		if (error instanceof JourneyError) {
			throw error;
		}
		throw new JourneyError(`Failed to create journey: ${error instanceof Error ? error.message : 'Unknown error'}`);
	}
}
