import { Journey } from '@planning-inspectorate/dynamic-forms/src/journey/journey.js';
import { getQuestionnaireSections } from './sections.ts';
import type { QuestionMap } from '@planning-inspectorate/dynamic-forms/src/questions.js';
import type { JourneyResponse } from '@planning-inspectorate/dynamic-forms/src/journey/journey-response.js';
import type { Request } from 'express';

export const JOURNEY_ID = 'questionnaire';

export function createJourney(questions: QuestionMap, response: JourneyResponse, req: Request) {
	if (!req.baseUrl.endsWith('/' + JOURNEY_ID)) {
		throw new Error(`not a valid request for the ${JOURNEY_ID} journey`);
	}

	return new Journey({
		journeyId: JOURNEY_ID,
		sections: getQuestionnaireSections(questions),
		taskListUrl: 'check-your-answers',
		journeyTemplate: 'views/layouts/forms-question.njk',
		taskListTemplate: 'views/layouts/forms-check-your-answers.njk',
		journeyTitle: 'Local Plans Questionnaire',
		returnToListing: false,
		makeBaseUrl: () => req.baseUrl,
		initialBackLink: '/questionnaire',
		response
	});
}
