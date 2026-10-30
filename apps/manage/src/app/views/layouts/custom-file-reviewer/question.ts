import { Question } from '@planning-inspectorate/dynamic-forms/src/questions/question.js';
import { COMMON_CONSTS } from '../../../classes/common-consts.ts';
import { gateway2questions } from '../../../../../../portal/src/app/views/manage-local-plans/gateway-2-submission/questions.ts';

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
		const reference = options.params.reference;
		return {
			...viewModel,
			documentGroups: this.buildSummaryList(Array.isArray(viewModel.answer) ? viewModel.answer : [], reference)
		};
	}

	buildSummaryList(documentGroups: any[], reference: string) {
		return documentGroups.map((group: any) => ({
			category: group.category,
			rows: (group.documents ?? [])
				.filter((document: any) => document.title?.trim().toLowerCase() !== 'workshop document')
				.map((document: any) => {
					const files = document.files ?? [];

					const fileLinksHtml =
						files.length > 0
							? files
									.map((file: any) => {
										const downloadUrl = `/case/${encodeURIComponent(reference)}/download-case-document/${encodeURIComponent(file.id)}`;

										return `<a class="govuk-link" href="${downloadUrl}">${file.fileName}</a><br>`;
									})
									.join('')
							: '<p class="govuk-body">Not provided</p>';

					const questionConfig = Object.values(gateway2questions).find(
						(question: any) =>
							question.title.trim().replace(/\s+/g, ' ').toLowerCase() ===
							document.title.trim().replace(/\s+/g, ' ').toLowerCase()
					);

					const actions = [
						{
							href: questionConfig
								? `/case/${encodeURIComponent(reference)}/${COMMON_CONSTS.GATEWAY_2_JOURNEY_ID}/gateway-2/${questionConfig.url}/check`
								: '#',
							text: 'Manage',
							visuallyHiddenText: document.title
						},
						{
							href: questionConfig
								? `/case/${encodeURIComponent(reference)}/${COMMON_CONSTS.GATEWAY_2_JOURNEY_ID}/gateway-2/${questionConfig.url}`
								: '#',
							text: 'Add',
							visuallyHiddenText: document.title
						}
					];

					return {
						key: { text: document.title },
						value: { html: fileLinksHtml },
						actions: { items: actions }
					};
				})
		}));
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
