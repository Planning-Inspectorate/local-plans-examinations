import { Journey, JourneyResponse, Section } from '@planning-inspectorate/dynamic-forms';
import type { Request } from 'express';

export const JOURNEY_ID = 'gateway-2-application';

// Creates the Gateway 2 journey and builds its URLs from the plan reference.
export function createJourney(req: Request, response: JourneyResponse, questions: Record<string, any>) {
	const planReference = Array.isArray(req.params.planReference)
		? req.params.planReference[0]
		: req.params.planReference;
	const baseUrl = planReference
		? `${req.baseUrl}/${planReference}/gateway-2-submission`
		: `${req.baseUrl}/gateway-2-submission`;

	return new Journey({
		journeyId: JOURNEY_ID,
		sections: [new Section('Procedural documents', 'procedural').addQuestion(questions.gateway2CoverLetter)],
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
