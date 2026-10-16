import type { JourneyResponse, Question } from '@planning-inspectorate/dynamic-forms';

export function questionHasNonEmptyDateAnswer(response: JourneyResponse, question: Question) {
	if (!response.answers) return false;
	const answerField = response.answers[question.fieldName];
	return typeof answerField === 'number' && !isNaN(answerField);
}
