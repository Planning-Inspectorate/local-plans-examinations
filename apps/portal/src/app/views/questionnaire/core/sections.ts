import { Section } from '@planning-inspectorate/dynamic-forms/src/section.js';
import { questionHasAnswer } from '@planning-inspectorate/dynamic-forms/src/components/utils/question-has-answer.js';
import { BOOLEAN_OPTIONS } from '@planning-inspectorate/dynamic-forms/src/components/boolean/question.js';

const SECTION_CONFIGS = [
	{ name: 'Personal Information', id: 'personal', questions: ['fullName', 'wantToProvideEmail', 'email'] },
	{ name: 'Your Experience', id: 'experience', questions: ['rating', 'feedback'] }
];

export const createQuestionnaireSections = (questions: Record<string, any>) =>
	SECTION_CONFIGS.map(({ name, id, questions: questionIds }) => {
		let section = new Section(name, id);

		questionIds.forEach((questionId) => {
			if (questions[questionId]) {
				section = section.addQuestion(questions[questionId]);

				// Add conditional logic for email question
				if (questionId === 'email') {
					section = section.withCondition((response: any) =>
						questionHasAnswer(response, questions.wantToProvideEmail, BOOLEAN_OPTIONS.YES)
					);
				}
			}
		});

		return section;
	});
