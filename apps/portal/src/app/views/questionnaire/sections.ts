import { Section } from '@planning-inspectorate/dynamic-forms/src/section.js';
import type { QuestionMap } from '@planning-inspectorate/dynamic-forms/src/questions.js';

export function getQuestionnaireSections(questions: QuestionMap) {
	return [
		new Section('Personal Information', 'personal').addQuestion(questions.fullName).addQuestion(questions.email),

		new Section('Your Experience', 'experience').addQuestion(questions.rating).addQuestion(questions.feedback)
	];
}
