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

	toViewModel(options: any) {
		const viewModel = super.toViewModel(options);

		return {
			...viewModel,
			documentGroups: Array.isArray(viewModel.answer) ? viewModel.answer : []
		};
	}

	formatAnswerForSummary(sectionSegment: string, journey: any, answer: unknown) {
		const groups = Array.isArray(answer) ? answer : [];
		const documentCount = groups.reduce(
			(total, group) =>
				total +
				(group.documents ?? []).reduce(
					(groupTotal: number, document: any) => groupTotal + (document.files?.length ?? 0),
					0
				),
			0
		);
		const baseAction = documentCount > 0 ? this.getAction(sectionSegment, journey, answer) : undefined;

		return [
			{
				key: this.title,
				value: `${documentCount} document(s)`,
				action: baseAction
					? {
							...baseAction,
							text: 'Review'
						}
					: undefined
			}
		];
	}
}
