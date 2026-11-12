import { createQuestions, questionClasses, type Question } from '@planning-inspectorate/dynamic-forms';
import { CUSTOM_COMPONENT_CLASSES } from '@pins/local-plans-lib/forms/custom-components/index.ts';
import { createDownloadDocumentSummaryFormatter as createFormatter } from '../utils.ts';
import { FRONT_OFFICE_GW2_QUESTIONS, FRONT_OFFICE_GW2_TEXT_QUESTIONS } from '@pins/local-plans-lib/app/questions.ts';

const allQuestionClasses = {
	...questionClasses,
	...CUSTOM_COMPONENT_CLASSES
};

export const CHECK_ANSWERS_REDIRECT_QUERY = 'checkAnswersRedirect';
export const CHECK_ANSWERS_REDIRECTS = {
	CHECK_YOUR_ANSWERS: 'check-your-answers',
	NEXT_QUESTION: 'next-question'
} as const;

export type CheckAnswersRedirect = (typeof CHECK_ANSWERS_REDIRECTS)[keyof typeof CHECK_ANSWERS_REDIRECTS];

// File-upload-only questions — used by gateway2FileUploadQuestionConfigs for upload routes.
export const GW2QUESTIONS = FRONT_OFFICE_GW2_QUESTIONS;

export function createGateway2Questions(planReference: string | undefined) {
	const fileUploadQuestions = Object.fromEntries(
		Object.entries(FRONT_OFFICE_GW2_QUESTIONS).map(([key, question]) => [
			key,
			{
				...question,
				formatSummaryValue: createDownloadDocumentSummaryFormatter(planReference)
			}
		])
	);

	const allQuestions = {
		...fileUploadQuestions,
		...FRONT_OFFICE_GW2_TEXT_QUESTIONS
	};

	return createQuestions(
		allQuestions,
		allQuestionClasses,
		{},
		{
			notStartedText: 'Not added',
			answerActionText: 'Add',
			continueButtonText: 'Save and return'
		}
	) as Record<string, Question>;
}

export function createDownloadDocumentSummaryFormatter(planReference: string | undefined) {
	return createFormatter(planReference, 'gateway-2-submission');
}
