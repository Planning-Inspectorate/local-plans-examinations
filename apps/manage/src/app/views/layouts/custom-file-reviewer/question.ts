import { Question } from '@planning-inspectorate/dynamic-forms/src/questions/question.js';

export default class CustomFileReviewerQuestion extends Question {
	constructor({ ...params }) {
		super({
			...params,
			viewFolder: 'views/layouts/custom-file-reviewer',
			title: params.title,
			question: params.question,
			fieldName: params.fieldName
		});
	}
}
