import { Journey, Section } from '@planning-inspectorate/dynamic-forms';
import type { JourneyResponse, Question } from '@planning-inspectorate/dynamic-forms';
import type { Request } from 'express';

export const JOURNEY_ID = 'examination-submission';

export function createJourney(req: Request, response: JourneyResponse, questions: Record<string, Question>) {
	const planReference = Array.isArray(req.params.planReference)
		? req.params.planReference[0]
		: req.params.planReference;
	const encodedPlanReference = planReference ? encodeURIComponent(planReference) : undefined;
	const baseUrl = planReference
		? `${req.baseUrl}/${encodedPlanReference}/examination-submission`
		: `${req.baseUrl}/examination-submission`;

	const journey = new Journey({
		journeyId: JOURNEY_ID,
		sections: [
			new Section('Examination details', 'examination-details')
				.addQuestion(questions.examinationWebsite)
				.addQuestion(questions.localPlanSubmission)
				.addQuestion(questions.mapOfPolicies)
				.addQuestion(questions.gateway3CompletionStatement)
				.addQuestion(questions.consultationEngagementSummary)
				.addQuestion(questions.consultationProposedPlanSummary)
				.addQuestion(questions.spatialStrategyRepresentations)
				.addQuestion(questions.statementOfCompliance)
				.addQuestion(questions.statementOfSoundness)
				.addQuestion(questions.environmentalReport)
				.addQuestion(questions.environmentalEffectsStatement)
				.addQuestion(questions.additionalEvidenceDocuments)
				.addQuestion(questions.changesSinceGateway3Statement)
				.addQuestion(questions.gateway3ReportRepresentations)
		],
		taskListUrl: '',
		journeyTemplate: 'views/layouts/forms-question.njk',
		taskListTemplate: 'views/manage-local-plans/examination-submission/check-your-answers.njk',
		journeyTitle: 'Examination submission',
		returnToListing: false,
		makeBaseUrl: () => baseUrl,
		initialBackLink: planReference ? baseUrl : '/',
		response
	});

	return useSubmissionPageBackLinks(journey, baseUrl);
}

function useSubmissionPageBackLinks(journey: Journey, submissionPageUrl: string): Journey {
	const getBackLink = journey.getBackLink.bind(journey);

	journey.getBackLink = (options: Parameters<Journey['getBackLink']>[0]) => {
		const { params, manageListQuestion } = options;
		const isManageListStep = Boolean(params.manageListAction || params.manageListItemId || params.manageListQuestion);

		if (!manageListQuestion && !isManageListStep) {
			return submissionPageUrl;
		}

		return getBackLink(options);
	};

	return journey;
}
