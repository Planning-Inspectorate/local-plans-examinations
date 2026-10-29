import { Question } from '@planning-inspectorate/dynamic-forms/src/questions/question.js';
import { fileUploadDownloadFormat } from '@pins/local-plans-lib/forms/custom-components/file-uploader/question.ts';
import { formatDateForDisplay } from '@planning-inspectorate/dynamic-forms';

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
		const uploadQuestionUrl = this.viewData?.uploadQuestionUrl;
		const caseReference = options.params.reference;
		const dataRows: Record<string, string>[][] = [];
		for (const file of Array.isArray(viewModel.answer) ? viewModel.answer : []) {
			const downloadUrl = `/case/${encodeURIComponent(caseReference)}/download-case-document/${file.metadata?.documentGuid}`;
			const documentDownloadHtml = fileUploadDownloadFormat(file, downloadUrl);
			const dateReceivedText = file.dateCreated ? formatDateForDisplay(file.dateCreated) : '';
			const removeHtml = `<a class="govuk-link" href="${uploadQuestionUrl}/remove/${encodeURIComponent(file.id)}">Remove<span class="govuk-visually-hidden"> ${encodeURIComponent(file.fileName)} + '</span></a>`;
			dataRows.push([{ html: documentDownloadHtml }, { text: dateReceivedText }, { html: removeHtml }]);
		}

		return {
			...viewModel,
			question: { ...viewModel.question, title: this.title },
			dataRows: dataRows
		};
	}
}
