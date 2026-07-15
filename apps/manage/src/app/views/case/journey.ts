import { Journey, JourneyResponse, Section } from '@planning-inspectorate/dynamic-forms';
import type { Request } from 'express';
import { ManageListSection } from '@planning-inspectorate/dynamic-forms/src/components/manage-list/manage-list-section.js';
import { createLpaOptions } from '../create-a-case/journey.ts';

export const OVERVIEW_JOURNEY_ID = 'edit-case-overview';
export const GATEWAY_1_JOURNEY_ID = 'gateway-1';

export function createOverviewJourney(req: Request, response: JourneyResponse, questions: Record<string, any>) {
	createLpaOptions(response, questions, req);
	const overviewUrl = req.baseUrl + '/overview';

	const journey = new Journey({
		journeyId: OVERVIEW_JOURNEY_ID,
		sections: [
			new Section('Overview', 'case-details')
				.addQuestion(questions.planTitle)
				.addQuestion(questions.planType)
				.addQuestion(questions.checkLpas, Object.assign(new ManageListSection().addQuestion(questions.lpa)))
				.addQuestion(questions.caseOfficer)
				.addQuestion(questions.planBand),
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
		journeyTemplate: 'views/layouts/forms-question.njk',
		taskListTemplate: 'views/layouts/case-overview.njk',
		journeyTitle: 'Manage case',
		returnToListing: false,
		makeBaseUrl: () => req.baseUrl + '/overview',
		initialBackLink: overviewUrl,
		response
	});

	return useOverviewBackLinks(journey, overviewUrl);
}

function useOverviewBackLinks(journey: Journey, overviewUrl: string): Journey {
	const getBackLink = journey.getBackLink.bind(journey);

	journey.getBackLink = (options: Parameters<Journey['getBackLink']>[0]) => {
		const { params, manageListQuestion } = options;
		const isManageListStep = Boolean(params.manageListAction || params.manageListItemId || params.manageListQuestion);

		if (!manageListQuestion && !isManageListStep) {
			return overviewUrl;
		}

		return getBackLink(options);
	};

	return journey;
}

export function gateway1Journey(req: Request, response: JourneyResponse, questions: Record<string, any>) {
	const gateway1Url = req.baseUrl + '/gateway-1';

	const journey = new Journey({
		journeyId: GATEWAY_1_JOURNEY_ID,
		sections: [
			new Section('Gateway 1', 'gateway-1')
				.addQuestion(questions.noticeOfIntentionPublishDate)
				.addQuestion(questions.gateway1estimatedDate)
				.addQuestion(questions.gateway1ActualDate)
				.addQuestion(questions.slaSentDate)
				.addQuestion(questions.slaReceivedDate)
				.addQuestion(questions.dsaCheck)
		],
		journeyTemplate: 'views/layouts/forms-question.njk',
		taskListTemplate: 'views/layouts/case-overview.njk',
		journeyTitle: 'Gateway 1',
		returnToListing: false,
		makeBaseUrl: () => gateway1Url,
		initialBackLink: gateway1Url,
		response
	});

	journey.getBackLink = () => gateway1Url;

	return journey;
}
