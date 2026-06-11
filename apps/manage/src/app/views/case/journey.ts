import { Journey, JourneyResponse, Section } from '@planning-inspectorate/dynamic-forms';
import type { Request } from 'express';

export const JOURNEY_ID = 'edit-case-overview';

//TODO use question library
export function createOverviewJourney(req: Request, response: JourneyResponse, questions: Record<string, any>) {
	return new Journey({
		journeyId: JOURNEY_ID,
		sections: [
			new Section('Overview', 'case-details')
				.addQuestion(questions.planTitle)
				.addQuestion(questions.planType)
				.addQuestion(questions.caseOfficer)
				.addQuestion(questions.lpa)
		],
		taskListUrl: '',
		journeyTemplate: 'views/layouts/forms-question.njk',
		taskListTemplate: 'views/layouts/case-overview.njk',
		journeyTitle: 'Manage case',
		returnToListing: false,
		makeBaseUrl: () => req.baseUrl,
		initialBackLink: '/',
		response
	});
}
