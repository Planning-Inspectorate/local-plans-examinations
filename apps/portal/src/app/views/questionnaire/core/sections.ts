import { Section } from '@planning-inspectorate/dynamic-forms/src/section.js';
import { questionHasAnswer } from '@planning-inspectorate/dynamic-forms/src/components/utils/question-has-answer.js';
import { BOOLEAN_OPTIONS } from '@planning-inspectorate/dynamic-forms/src/components/boolean/question.js';
import type { QuestionnaireQuestions } from './service.ts';

/**
 * Creates questionnaire sections with conditional logic and question flow.
 * Organizes questions into logical groups and implements conditional display rules.
 *
 * @param questions - Question definitions object
 * @returns Array of configured sections for the questionnaire
 */
export const createSections = (questions: QuestionnaireQuestions) => [
	// Personal Information section with conditional email question
	new Section('Personal Information', 'personal')
		.addQuestion(questions.fullName)
		.addQuestion(questions.wantToProvideEmail)
		.addQuestion(questions.email)
		.withCondition((response: any) => questionHasAnswer(response, questions.wantToProvideEmail, BOOLEAN_OPTIONS.YES)),

	// Experience section for feedback and rating
	new Section('Your Experience', 'experience').addQuestion(questions.rating).addQuestion(questions.feedback)
];
