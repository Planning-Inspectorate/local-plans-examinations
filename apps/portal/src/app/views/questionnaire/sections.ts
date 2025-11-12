import { Section } from '@planning-inspectorate/dynamic-forms/src/section.js';
import type { QuestionMap } from './types.ts';
import { QUESTIONNAIRE_CONFIG } from './config.ts';

export function getQuestionnaireSections(questions: QuestionMap): Section[] {
	return [
		new Section(QUESTIONNAIRE_CONFIG.SECTIONS.PERSONAL.name, QUESTIONNAIRE_CONFIG.SECTIONS.PERSONAL.segment)
			.addQuestion(questions.fullName)
			.addQuestion(questions.email),

		new Section(QUESTIONNAIRE_CONFIG.SECTIONS.EXPERIENCE.name, QUESTIONNAIRE_CONFIG.SECTIONS.EXPERIENCE.segment)
			.addQuestion(questions.rating)
			.addQuestion(questions.feedback)
	];
}
