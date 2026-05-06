import { Journey, JourneyResponse, Section } from '@planning-inspectorate/dynamic-forms';
import type { Request } from 'express';

export const JOURNEY_ID = 'create-a-case';

export function createJourney(req: Request, response: JourneyResponse, questions: Record<string, any>) {
	const lpaHistory = req.session.lpaHistory || [];
	const lpaOptions = lpaHistory.map((lpa: string) => ({
		value: lpa,
		text: lpa
	}));

	if (lpaOptions.length > 0) {
		const lpaField = questions.contactDetails.inputFields.find((f: any) => f.name === 'lpa');
		if (lpaField) {
			lpaField.options = lpaOptions;
		}
	}

	return new Journey({
		journeyId: JOURNEY_ID,
		sections: [
			new Section('Create a case', 'case-details')
				.addQuestion(questions.caseOfficer)
				.addQuestion(questions.planTitle)
				.addQuestion(questions.planType)
				.addQuestion(questions.lpa)
				.addQuestion(questions.anotherLpa)
				.addQuestion(questions.contactDetails)
				.addQuestion(questions.anotherContact)
				.addQuestion(questions.additionalContactDetails)
				.addQuestion(questions.keyStageDates)
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
