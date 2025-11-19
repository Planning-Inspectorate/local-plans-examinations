import { Section } from '@planning-inspectorate/dynamic-forms/src/section.js';

const SECTION_CONFIGS = [
	{ name: 'Personal Information', id: 'personal', questions: ['fullName', 'email'] },
	{ name: 'Your Experience', id: 'experience', questions: ['rating', 'feedback'] }
];

export const createQuestionnaireSections = (questions: Record<string, any>) =>
	SECTION_CONFIGS.map(({ name, id, questions: questionIds }) => {
		const section = new Section(name, id);
		questionIds.forEach((questionId) => {
			if (questions[questionId]) section.addQuestion(questions[questionId]);
		});
		return section;
	});
