import { Question } from '@planning-inspectorate/dynamic-forms/src/questions/question.js';

export default class CustomDocumentsQuestion extends Question {
	private config = {};

	constructor({ ...params }) {
		super({
			...params,
			viewFolder: 'views/custom-documents-viewer',
			title: params.title,
			question: params.question,
			fieldName: params.fieldName
		});

		this.config = {
			actionButtonVisibleInSummary: true
		};
		// this.actionLink = {
		// 	href : '#',
		// 	text : 'Review'
		// }
	}
}
