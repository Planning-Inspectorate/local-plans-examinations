import { Journey } from '@planning-inspectorate/dynamic-forms';
import type { JourneyResponse } from '@planning-inspectorate/dynamic-forms';
import type { Request } from 'express';

export const JOURNEY_ID = 'gateway-3-submission';

export function createJourney(req: Request, response: JourneyResponse) {
	const planReference = Array.isArray(req.params.planReference)
		? req.params.planReference[0]
		: req.params.planReference;
	const encodedPlanReference = planReference ? encodeURIComponent(planReference) : undefined;
	const baseUrl = planReference
		? `${req.baseUrl}/${encodedPlanReference}/gateway-3-submission`
		: `${req.baseUrl}/gateway-3-submission`;

	return new Journey({
		journeyId: JOURNEY_ID,
		sections: [],
		taskListUrl: '',
		journeyTemplate: 'views/layouts/forms-question.njk',
		taskListTemplate: 'views/manage-local-plans/gateway-3-submission/check-your-answers.njk',
		journeyTitle: 'Gateway 3 submission',
		returnToListing: false,
		makeBaseUrl: () => baseUrl,
		initialBackLink: planReference ? baseUrl : '/',
		response
	});
}
