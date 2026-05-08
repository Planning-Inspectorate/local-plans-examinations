import { Journey, JourneyResponse, Section } from '@planning-inspectorate/dynamic-forms';
import { whenQuestionHasAnswer } from '@planning-inspectorate/dynamic-forms/src/components/utils/question-has-answer.js';
import { BOOLEAN_OPTIONS } from '@planning-inspectorate/dynamic-forms/src/components/boolean/question.js';
import type { Request } from 'express';
import { ManageListSection } from '@planning-inspectorate/dynamic-forms/src/components/manage-list/manage-list-section.js';

export const JOURNEY_ID = 'create-a-case';

export function createJourney(req: Request, response: JourneyResponse, questions: Record<string, any>) {
	const lpaHistory = [];

	if (response.answers.lpa) {
		const lpaText = questions.lpa.options.find((opt: any) => opt.value === response.answers.lpa)?.text;
		if (lpaText) lpaHistory.push(lpaText);
	}

	if (response.answers.anotherLpa === 'yes' && response.answers.secondaryLpa) {
		const lpaText = questions.secondaryLpa.options.find(
			(opt: any) => opt.value === response.answers.secondaryLpa
		)?.text;
		if (lpaText) lpaHistory.push(lpaText);
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
			new Section('Create a case', 'case-details')
				.addQuestion(questions.caseOfficer)
				.addQuestion(questions.planTitle)
				.addQuestion(questions.planType)
				.addQuestion(questions.lpa)
				.addQuestion(questions.anotherLpa)
				.addQuestion(questions.secondaryLpa)
				.withCondition(whenQuestionHasAnswer(questions.anotherLpa, BOOLEAN_OPTIONS.YES))
				//.addQuestion(questions.contactDetails)
				//.addQuestion(questions.anotherContact)
				//.addQuestion(questions.additionalContactDetails)
				//.withCondition(whenQuestionHasAnswer(questions.anotherContact, BOOLEAN_OPTIONS.YES))
				.addQuestion(
					questions.checkContactDetails,
					Object.assign(new ManageListSection().addQuestion(questions.contactDetails))
				)
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
