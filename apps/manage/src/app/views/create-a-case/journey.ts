import { Journey, JourneyResponse, Section } from '@planning-inspectorate/dynamic-forms';
import type { Request } from 'express';
import { ManageListSection } from '@planning-inspectorate/dynamic-forms/src/components/manage-list/manage-list-section.js';

export const JOURNEY_ID = 'create-a-case';

export function createJourney(req: Request, response: JourneyResponse, questions: Record<string, any>) {
	const lpaAnswers = response.answers.checkLpas || [];
	const lpaHistory: string[] = [];

	if (Array.isArray(lpaAnswers)) {
		lpaAnswers.forEach((lpaAnswer: any) => {
			const lpaText = questions.lpa.options.find((opt: any) => opt.value === lpaAnswer.lpa)?.text;
			if (lpaText) lpaHistory.push(lpaText);
		});
	}

	req.session.lpaHistory = lpaHistory;

	const lpaOptions = lpaHistory.map((lpa: string) => ({
		value: lpa,
		text: lpa
	}));

	if (lpaOptions.length > 0) {
		const lpaField = questions.contactDetails.inputFields.find((f: any) => f.fieldName === 'lpaContact');
		if (lpaField) {
			lpaField.options = lpaOptions;

			if (lpaOptions.length === 1) {
				response.answers.lpaContact = lpaOptions[0].value;
			}
		}
	}

	return new Journey({
		journeyId: JOURNEY_ID,
		sections: [
			new Section('Overview', 'case-details')
				.addQuestion(questions.caseOfficer)
				.addQuestion(questions.planTitle)
				.addQuestion(questions.planType)
				.addQuestion(questions.checkLpas, Object.assign(new ManageListSection().addQuestion(questions.lpa))),
			new Section('Contacts', 'contact-details').addQuestion(
				questions.checkContactDetails,
				Object.assign(new ManageListSection().addQuestion(questions.contactDetails))
			),
			new Section('Dates', 'dates').addQuestion(questions.keyStageDates)
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
