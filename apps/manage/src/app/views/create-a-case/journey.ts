import { Journey, JourneyResponse, Section } from '@planning-inspectorate/dynamic-forms';
import type { Request } from 'express';

export const JOURNEY_ID = 'create-a-case';

export function createJourney(req: Request, response: JourneyResponse, questions: Record<string, any>) {
	return new Journey({
		journeyId: JOURNEY_ID,
		sections: [
			new Section('Create a case', 'case-details')
				.addQuestion(questions.caseName)
				.addQuestion(questions.referenceNumber)
				.addQuestion(questions.email)
		],
		taskListUrl: 'check-your-answers',
		journeyTemplate: 'views/layouts/forms-question.njk',
		taskListTemplate: 'views/layouts/forms-check-your-answers.njk',
		journeyTitle: 'Create a case',
		returnToListing: false,
		makeBaseUrl: () => req.baseUrl,
		initialBackLink: '/',
		response
	});
}
