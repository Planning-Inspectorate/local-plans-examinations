import { Journey, JourneyResponse, Section } from '@planning-inspectorate/dynamic-forms';
import type { Request } from 'express';

export const JOURNEY_ID = 'create-a-case';

//TODO find correct type for `questions`
export function createJourney(questions: any, journeyResponse: JourneyResponse, req: Request) {
	return new Journey({
		journeyId: JOURNEY_ID,
		sections: [
			new Section('Create a case', 'details')
				.addQuestion(questions.caseOfficer)
				.addQuestion(questions.planTitle)
				.addQuestion(questions.typeOfApplication)
				.addQuestion(questions.lpaName)
				.addQuestion(questions.leadContactName)
				.addQuestion(questions.leadContactEmail)
				.addQuestion(questions.leadContactPhone)
				.addQuestion(questions.secondaryLPA)
				.addQuestion(questions.anotherContact)
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
