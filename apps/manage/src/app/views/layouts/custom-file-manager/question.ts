import { Question } from '@planning-inspectorate/dynamic-forms';

/** Lists uploaded files with links to add or remove documents on the upload question named by `uploadQuestionUrl`. */
export default class CustomFileManagerQuestion extends Question {
	constructor({ ...params }) {
		super({
			...params,
			viewFolder: 'views/layouts/custom-file-manager',
			title: params.title,
			question: params.question,
			fieldName: params.fieldName
		});
	}

	toViewModel(options: any) {
		const viewModel = super.toViewModel(options);

		return {
			...viewModel,
			question: { ...viewModel.question, title: this.title },
			documents: Array.isArray(viewModel.answer) ? viewModel.answer : [],
			uploadQuestionUrl: this.viewData?.uploadQuestionUrl
		};
	}
}
