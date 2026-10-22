import type { JourneyResponse, Question } from '@planning-inspectorate/dynamic-forms';

export function questionHasNonEmptyAnswer(response: JourneyResponse, question: Question) {
	if (!response.answers) return false;
	const answerField = response.answers[question.fieldName];
	console.log('nonempty check');
	console.log(answerField);
	console.log(!!answerField);
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
