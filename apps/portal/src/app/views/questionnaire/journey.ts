import { Journey } from '@planning-inspectorate/dynamic-forms/src/journey/journey.js';
import { getQuestionnaireSections } from './sections.ts';
import type { QuestionMap, JourneyResponse } from './types.ts';
import type { Request } from 'express';
import { QUESTIONNAIRE_CONFIG } from './config.ts';

export const JOURNEY_ID = QUESTIONNAIRE_CONFIG.JOURNEY_ID;

export function createJourney(questions: QuestionMap, response: JourneyResponse, req: Request): Journey {
	if (!req.baseUrl.endsWith('/' + JOURNEY_ID)) {
		throw new Error(`not a valid request for the ${JOURNEY_ID} journey`);
	}

	return new Journey({
		journeyId: JOURNEY_ID,
		sections: getQuestionnaireSections(questions),
		taskListUrl: QUESTIONNAIRE_CONFIG.ROUTES.CHECK_YOUR_ANSWERS,
		journeyTemplate: QUESTIONNAIRE_CONFIG.TEMPLATES.FORMS_QUESTION,
		taskListTemplate: QUESTIONNAIRE_CONFIG.TEMPLATES.FORMS_CHECK_ANSWERS,
		journeyTitle: 'Local Plans Questionnaire',
		returnToListing: false,
		makeBaseUrl: () => req.baseUrl,
		initialBackLink: '/questionnaire',
		response
	});
}
