import { Section } from '@planning-inspectorate/dynamic-forms/src/section.js';
import { questionHasAnswer } from '@planning-inspectorate/dynamic-forms/src/components/utils/question-has-answer.js';
import { BOOLEAN_OPTIONS } from '@planning-inspectorate/dynamic-forms/src/components/boolean/question.js';

// Creates sections with conditional logic - email question only shows if user opts in
export const createQuestionnaireSections = (questions: Record<string, any>) => [
	new Section('Personal Information', 'personal')
		.addQuestion(questions.fullName)
		.addQuestion(questions.wantToProvideEmail)
		.addQuestion(questions.email)
		.withCondition((response) => questionHasAnswer(response, questions.wantToProvideEmail, BOOLEAN_OPTIONS.YES)),

	new Section('Your Experience', 'experience').addQuestion(questions.rating).addQuestion(questions.feedback)
];
