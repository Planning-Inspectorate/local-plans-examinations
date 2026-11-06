import type { JourneyResponse, Question } from '@planning-inspectorate/dynamic-forms';

export function questionHasNonEmptyAnswer(response: JourneyResponse, question: Question) {
	if (!response.answers) return false;
	const answerField = response.answers[question.fieldName];
	return !!answerField;
}

export function questionHasEmptyAnswer(response: JourneyResponse, question: Question) {
	return !questionHasNonEmptyAnswer(response, question);
}

export function questionHasNonEmptyDateAnswer(response: JourneyResponse, question: Question) {
	if (!response.answers) return false;
	const answerField = response.answers[question.fieldName];
	return typeof answerField === 'number' && !isNaN(answerField);
}

export function createGw2DocumentQuestions(questions: Record<string, Question>): Question[] {
	return [
		questions.gateway2CoverLetter,
		questions.localPlanTimetable,
		questions.projectInitiationDocument,
		questions.draftStatementOfCompliance,
		questions.draftStatementOfSoundness,
		questions.noticeOfIntention,
		questions.scopingConsultationDocuments,
		questions.consultationSummaryFeedbackScoping,
		questions.consultationSummaryProposedContent,
		questions.gateway1SelfAssessment,
		questions.consultationOnProposedContent,
		questions.subsequentWorkTowardsADraftPlan
	];
}
