import { Section } from '@planning-inspectorate/dynamic-forms/src/section.js';
import { questionHasAnswer } from '@planning-inspectorate/dynamic-forms/src/components/utils/question-has-answer.js';
import { BOOLEAN_OPTIONS } from '@planning-inspectorate/dynamic-forms/src/components/boolean/question.js';

/**
 * Creates questionnaire sections with conditional logic
 *
 * Organizes questions into logical sections and implements conditional
 * questioning where the email question only appears if the user opts in.
 *
 * @param {Record<string, any>} questions - Question objects from createQuestionnaireQuestions
 * @returns {Section[]} Array of configured section objects
 *
 * @example
 * ```typescript
 * const questions = createQuestionnaireQuestions();
 * const sections = createQuestionnaireSections(questions);
 * // Returns: [Personal Information section, Your Experience section]
 * ```
 */
export const createQuestionnaireSections = (questions: Record<string, any>) => [
	new Section('Personal Information', 'personal')
		.addQuestion(questions.fullName)
		.addQuestion(questions.wantToProvideEmail)
		.addQuestion(questions.email)
		.withCondition((response) => questionHasAnswer(response, questions.wantToProvideEmail, BOOLEAN_OPTIONS.YES)),

	new Section('Your Experience', 'experience').addQuestion(questions.rating).addQuestion(questions.feedback)
];
