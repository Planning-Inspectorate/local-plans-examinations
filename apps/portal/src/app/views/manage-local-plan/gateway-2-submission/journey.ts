import { Journey, JourneyResponse, Section } from '@planning-inspectorate/dynamic-forms';
import type { Request } from 'express';
// import { ManageListSection } from '@planning-inspectorate/dynamic-forms/src/components/manage-list/manage-list-section.js';

export const JOURNEY_ID = 'gateway-2-application';

// export function createLpaOptions(response: JourneyResponse, questions: Record<string, any>, req: Request) {
// 	const lpaAnswers = response.answers.checkLpas || [];
// 	const lpaHistory: string[] = [];

// 	if (Array.isArray(lpaAnswers)) {
// 		lpaAnswers.forEach((lpaAnswer: any) => {
// 			const lpaText = questions.lpa.options.find((opt: any) => opt.value === lpaAnswer.lpa)?.text;
// 			if (lpaText) lpaHistory.push(lpaText);
// 		});
// 	}

// 	req.session.lpaHistory = lpaHistory;

// 	const lpaOptions = lpaHistory.map((lpa: string) => ({
// 		value: lpa,
// 		text: lpa
// 	}));

// 	if (lpaOptions.length > 0) {
// 		const lpaField = questions.contactDetails.inputFields.find((f: any) => f.fieldName === 'lpaContact');
// 		if (lpaField) {
// 			lpaField.options = lpaOptions;

// 			if (lpaOptions.length === 1) {
// 				response.answers.lpaContact = lpaOptions[0].value;
// 			}
// 		}
// 	}

// 	questions.lpa.options = questions.lpa.options.map((opt: any) => ({
// 		...opt,
// 		disabled: lpaHistory.includes(opt.text)
// 	}));
// }

export function createJourney(req: Request, response: JourneyResponse, questions: Record<string, any>) {
	// createLpaOptions(response, questions, req);
	const planReference = Array.isArray(req.params.planReference)
		? req.params.planReference[0]
		: req.params.planReference;
	const baseUrl = planReference
		? `${req.baseUrl}/${planReference}/gateway-2-submission`
		: `${req.baseUrl}/gateway-2-submission`;

	return new Journey({
		journeyId: JOURNEY_ID,
		sections: [
			new Section('Procedural documents', 'procedural')
				// .addQuestion(questions.planTitle)
				// .addQuestion(questions.planAddress)
				// .addQuestion(questions.noOfPlans)
				.addQuestion(questions.gateway2CoverLetter)
			// new Section('Consultation documents', 'consultation')
			// 	.addQuestion(questions.isCunningPlan)
			// 	.addQuestion(questions.planDescription)
			// 	.addQuestion(questions.planDate),
			// new Section('Sonias documents', 'sonias')
			// 	.addQuestion(questions.SoniasPlan)
			// 	.addQuestion(questions.AnishasNoOfPlans)
		],
		taskListUrl: '',
		journeyTemplate: 'views/layouts/forms-question.njk',
		taskListTemplate: 'views/layouts/forms-check-your-answers.njk',
		journeyTitle: 'Gateway 2 Application',
		returnToListing: false,
		makeBaseUrl: () => baseUrl,
		initialBackLink: planReference ? baseUrl : '/',
		response
	});
}
