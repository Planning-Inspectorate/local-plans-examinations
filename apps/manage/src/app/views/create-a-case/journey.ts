import { Journey, JourneyResponse, Section } from '@planning-inspectorate/dynamic-forms';
import type { Request } from 'express';

export const JOURNEY_ID = 'create-a-case';

//TODO find correct type for `questions`
export function createJourney(questions: any, journeyResponse: JourneyResponse, req: Request) {
	return new Journey({
		journeyId: JOURNEY_ID,
		sections: [
			new Section('Section 1', 'questions')
				.addQuestion(questions.isItWorking)
				.addQuestion(questions.q2)
				.addQuestion(questions.q3)
				.addQuestion(questions.developmentDescription)
				.addQuestion(questions.expectedDateOfSubmission)
		],
		taskListUrl: 'check-your-answers',
		journeyTemplate: 'views/layouts/forms-question.njk',
		taskListTemplate: 'views/layouts/forms-check-your-answers.njk',
		journeyTitle: 'Create a case',
		returnToListing: false,
		makeBaseUrl: () => req.baseUrl,
		initialBackLink: '/create-a-case',
		response: journeyResponse
	});
}
