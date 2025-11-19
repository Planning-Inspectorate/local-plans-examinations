import { Journey } from '@planning-inspectorate/dynamic-forms/src/journey/journey.js';
import { createQuestionnaireSections } from './sections.ts';
import { QUESTIONNAIRE_CONFIG } from './config.ts';
import type { Request } from 'express';

const validateJourneyRequest = (req: Request): void => {
	if (!req.baseUrl.endsWith(`/${QUESTIONNAIRE_CONFIG.id}`)) {
		throw new Error(`Invalid journey request for ${QUESTIONNAIRE_CONFIG.id}`);
	}
};

export const createQuestionnaireJourney = (questions: Record<string, any>, response: any, req: Request) => {
	validateJourneyRequest(req);

	return new Journey({
		journeyId: QUESTIONNAIRE_CONFIG.id,
		sections: createQuestionnaireSections(questions),
		taskListUrl: QUESTIONNAIRE_CONFIG.routes.checkAnswers,
		journeyTemplate: QUESTIONNAIRE_CONFIG.templates.question,
		taskListTemplate: QUESTIONNAIRE_CONFIG.templates.checkAnswers,
		journeyTitle: 'Local Plans Questionnaire',
		returnToListing: false,
		makeBaseUrl: () => req.baseUrl,
		initialBackLink: '/questionnaire',
		response
	});
};
