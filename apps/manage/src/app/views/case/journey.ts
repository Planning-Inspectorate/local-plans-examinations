import { Journey, ManageListSection, Section } from '@planning-inspectorate/dynamic-forms';
import type { JourneyResponse } from '@planning-inspectorate/dynamic-forms';
import type { Request } from 'express';
import { createLpaOptions } from '../create-a-case/journey.ts';

export const OVERVIEW_JOURNEY_ID = 'edit-case-overview';
export const GATEWAY_1_JOURNEY_ID = 'gateway-1';
export const GATEWAY_2_JOURNEY_ID = 'gateway-2';
export const GATEWAY_3_JOURNEY_ID = 'gateway-3';
export const EXAMINATION_JOURNEY_ID = 'examination';

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
				.addQuestion(questions.programmeOfficerDetails)
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

	return getBacklinks(journey, overviewUrl);
}

export function createGateway3Journey(req: Request, response: JourneyResponse, questions: Record<string, any>) {
	const gateway3Url = req.baseUrl + '/gateway-3';

	const journey = new Journey({
		journeyId: GATEWAY_3_JOURNEY_ID,
		sections: [
			new Section('Gateway 3', 'gateway-3')
				.addQuestion(questions.gateway3ExpectedDate)
				.addQuestion(questions.gateway3ActualDate)
				.addQuestion(questions.gateway3AssessorsName)
				.addQuestion(questions.gateway3AssessorDateOfAppointment)
				.addQuestion(questions.programmeOfficerDetails)
				.addQuestion(questions.gateway3CompletionDate)
		],
		journeyTemplate: 'views/layouts/forms-question.njk',
		taskListTemplate: 'views/layouts/case-overview.njk',
		journeyTitle: 'Gateway 3',
		returnToListing: false,
		makeBaseUrl: () => gateway3Url,
		initialBackLink: gateway3Url,
		response
	});

	return getBacklinks(journey, gateway3Url);
}

export function createGateway2Journey(req: Request, response: JourneyResponse, questions: Record<string, any>) {
	const gateway2Url = req.baseUrl + '/gateway-2';
	const journey = new Journey({
		journeyId: GATEWAY_2_JOURNEY_ID,
		sections: [
			new Section('Gateway 2', 'gateway-2')
				.addQuestion(questions.gateway2ExpectedDate)
				.addQuestion(questions.gateway2ActualDate)
				.addQuestion(questions.gateway2ValidDate)
				.addQuestion(questions.gateway2AssessorsName)
				.addQuestion(questions.assessorDateOfAppointment),
			new Section('Workshop', 'workshop').addQuestion(questions.workshopDate).addQuestion(questions.workshopVenue),
			new Section('Report', 'report').addQuestion(questions.gateway2Report).addQuestion(questions.reportPublishedDate)
		],
		//taskListUrl: 'check-your-answers',
		journeyTemplate: 'views/layouts/forms-question.njk',
		taskListTemplate: 'views/layouts/case-overview.njk',
		journeyTitle: 'Gateway 2',
		returnToListing: false,
		makeBaseUrl: () => gateway2Url,
		initialBackLink: gateway2Url,
		response
	});

	return getBacklinks(journey, gateway2Url);
}

export function createGateway1Journey(req: Request, response: JourneyResponse, questions: Record<string, any>) {
	const gateway1Url = req.baseUrl + '/gateway-1';

	const journey = new Journey({
		journeyId: GATEWAY_1_JOURNEY_ID,
		sections: [
			new Section('Gateway 1', 'gateway-1')
				.addQuestion(questions.noticeOfIntentionPublishDate)
				.addQuestion(questions.gateway1ExpectedDate)
				.addQuestion(questions.gateway1ActualDate)
				.addQuestion(questions.slaSentDate)
				.addQuestion(questions.signedSla)
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

	return getBacklinks(journey, gateway1Url);
}

export function createExaminationJourney(req: Request, response: JourneyResponse, questions: Record<string, any>) {
	const examinationUrl = req.baseUrl + '/examination';

	const journey = new Journey({
		journeyId: EXAMINATION_JOURNEY_ID,
		sections: [
			new Section('Examination', 'examination')
				.addQuestion(questions.expectedSubmissionForExaminationDate)
				.addQuestion(questions.submissionForExaminationDate),
			new Section('Inspectors', 'inspectors')
				.addQuestion(questions.examiningInspector1)
				.addQuestion(questions.examiningInspector2)
				.addQuestion(questions.examiningInspector3)
				.addQuestion(questions.examiningInspectorAppointmentDate),
			new Section('Examination website', 'examination-website').addQuestion(questions.examinationWebsite),
			new Section('Letters', 'letters')
				.addQuestion(questions.letterSentToMHCLGDate)
				.addQuestion(questions.letterIssueDate),
			new Section('QA', 'QA')
				.addQuestion(questions.qaDate)
				.addQuestion(questions.qaInspector1)
				.addQuestion(questions.qaInspector2)
				.addQuestion(questions.qaInspector3)
				.addQuestion(questions.sentToPanelDate)
				.addQuestion(questions.panelResponseSentToInspector),
			new Section('Fact Check', 'fact-check')
				.addQuestion(questions.factCheckDateReceivedFromInspector)
				.addQuestion(questions.factCheckDueDate)
				.addQuestion(questions.factCheckActualDate)
				.addQuestion(questions.factCheckReceivedBackFromLPADate)
				.addQuestion(questions.finalReportIssueDate),
			new Section('Important dates for this plan', 'important-dates')
				.addQuestion(questions.planPauseStartDate)
				.addQuestion(questions.planPauseEndDate)
				.addQuestion(questions.withdrawnDate)
				.addQuestion(questions.isSound)
				.addQuestion(questions.soundUnsoundDate)
				.addQuestion(questions.adoptionDate)
				.addQuestion(questions.approvedForCILDate)
		],
		journeyTemplate: 'views/layouts/forms-question.njk',
		taskListTemplate: 'views/layouts/case-overview.njk',
		journeyTitle: 'Examination',
		returnToListing: false,
		makeBaseUrl: () => examinationUrl,
		initialBackLink: examinationUrl,
		response
	});
	return getBacklinks(journey, examinationUrl);
}

function getBacklinks(journey: Journey, overviewUrl: string): Journey {
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
