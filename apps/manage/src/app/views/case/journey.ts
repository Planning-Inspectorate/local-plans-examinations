import { Journey, JourneyResponse, Section } from '@planning-inspectorate/dynamic-forms';
import type { Request } from 'express';
import { ManageListSection } from '@planning-inspectorate/dynamic-forms/src/components/manage-list/manage-list-section.js';

export const JOURNEY_ID = 'edit-case-overview';

//TODO use question library
export function createOverviewJourney(req: Request, response: JourneyResponse, questions: Record<string, any>) {
	return new Journey({
		journeyId: JOURNEY_ID,
		sections: [
			new Section('Overview', 'case-details')
				.addQuestion(questions.planTitle)
				.addQuestion(questions.planType)
				.addQuestion(questions.checkLpas, Object.assign(new ManageListSection().addQuestion(questions.lpa)))
				.addQuestion(questions.caseOfficer),
			new Section('Contacts', 'contacts')
				.addQuestion(
					questions.checkContactDetails,
					Object.assign(new ManageListSection().addQuestion(questions.contactDetails))
				)
				.addQuestion(questions.programmeOfficer)
				.addQuestion(questions.examinationWebsite)
				.addQuestion(questions.assessorGateway2)
				.addQuestion(questions.assessorGateway3)
				.addQuestion(questions.examiningInspector1)
				.addQuestion(questions.examiningInspector2)
				.addQuestion(questions.examiningInspector3)
				.addQuestion(questions.qaInspector1)
				.addQuestion(questions.qaInspector2)
				.addQuestion(questions.qaInspector3)
		],
		taskListUrl: '',
		journeyTemplate: 'views/layouts/forms-question.njk',
		taskListTemplate: 'views/layouts/case-overview.njk',
		journeyTitle: 'Manage case',
		returnToListing: false,
		makeBaseUrl: () => req.baseUrl + '/overview',
		initialBackLink: '/',
		response
	});
}
