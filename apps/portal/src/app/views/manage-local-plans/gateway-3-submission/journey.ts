import { Journey, Section } from '@planning-inspectorate/dynamic-forms';
import type { JourneyResponse, Question } from '@planning-inspectorate/dynamic-forms';
import type { Request } from 'express';

export const JOURNEY_ID = 'gateway-3-submission';

export function createJourney(req: Request, response: JourneyResponse, questions: Record<string, Question>) {
	const planReference = Array.isArray(req.params.planReference)
		? req.params.planReference[0]
		: req.params.planReference;
	const encodedPlanReference = planReference ? encodeURIComponent(planReference) : undefined;
	const baseUrl = planReference
		? `${req.baseUrl}/${encodedPlanReference}/gateway-3-submission`
		: `${req.baseUrl}/gateway-3-submission`;

	const journey = new Journey({
		journeyId: JOURNEY_ID,
		sections: [
			new Section('Required Information', 'required-information')
				.addQuestion(questions.examinationWebsite)
				.addQuestion(questions.proposedLocalPlan)
				.addQuestion(questions.mapOfPolicies)
				.addQuestion(questions.statementOfCompliance)
				.addQuestion(questions.statementOfSoundness)
				.addQuestion(questions.consultationEngagementSummary)
				.addQuestion(questions.scopingConsultationSummary)
				.addQuestion(questions.consultationContentEvidenceSummary)
				.addQuestion(questions.consultationProposedPlanSummary)
				.addQuestion(questions.practicalArrangementsStatement)
		],
		taskListUrl: '',
		journeyTemplate: 'views/layouts/forms-question.njk',
		taskListTemplate: 'views/manage-local-plans/gateway-3-submission/check-your-answers.njk',
		journeyTitle: 'Gateway 3 submission',
		returnToListing: false,
		makeBaseUrl: () => baseUrl,
		initialBackLink: planReference ? baseUrl : '/',
		response
	});
	return getBacklinks(journey, baseUrl);
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
