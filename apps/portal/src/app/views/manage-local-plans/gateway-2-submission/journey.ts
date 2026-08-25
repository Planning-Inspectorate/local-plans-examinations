import { Journey, Section } from '@planning-inspectorate/dynamic-forms';
import type { JourneyResponse, Question } from '@planning-inspectorate/dynamic-forms';
import type { Request } from 'express';

export const JOURNEY_ID = 'gateway-2-submission';

// Creates the Gateway 2 journey and builds its URLs from the plan reference.
export function createJourney(req: Request, response: JourneyResponse, questions: Record<string, Question>) {
	const planReference = Array.isArray(req.params.planReference)
		? req.params.planReference[0]
		: req.params.planReference;
	const encodedPlanReference = planReference ? encodeURIComponent(planReference) : undefined;
	const baseUrl = planReference
		? `${req.baseUrl}/${encodedPlanReference}/gateway-2-submission`
		: `${req.baseUrl}/gateway-2-submission`;

	return new Journey({
		journeyId: JOURNEY_ID,
		sections: [
			new Section('Procedural Documents', 'procedural')
				.addQuestion(questions.gateway2CoverLetter)
				.addQuestion(questions.localPlanTimetable)
				.addQuestion(questions.projectInitiationDocument)
				.addQuestion(questions.draftStatementOfCompliance)
				.addQuestion(questions.draftStatementOfSoundness),
			new Section('Consultation Documents', 'consultation')
				.addQuestion(questions.noticeOfIntention)
				.addQuestion(questions.scopingConsultationDocuments)
				.addQuestion(questions.consultationSummaryFeedbackScoping)
		],
		taskListUrl: '',
		journeyTemplate: 'views/layouts/forms-question.njk',
		taskListTemplate: 'views/manage-local-plans/gateway-2-submission/check-your-answers.njk',
		journeyTitle: 'Gateway 2 Application',
		returnToListing: false,
		makeBaseUrl: () => baseUrl,
		initialBackLink: planReference ? baseUrl : '/',
		response
	});
}
