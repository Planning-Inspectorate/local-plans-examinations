import { Question } from '@planning-inspectorate/dynamic-forms/src/questions/question.js';
import type { Journey } from '@planning-inspectorate/dynamic-forms';
import { EXAMINATION_STATUS_ID } from '@pins/local-plans-database/src/seed/static-data/ids/index.ts';
import {
	EXAMINATION_DOCUMENT_LABELS,
	EXAMINATION_OTHER_DOCUMENT_SETS,
	EXAMINATION_REQUIRED_DOCUMENT_SETS
} from '@pins/local-plans-database/src/seed/static-data/ids/document-set.ts';
import type { ExaminationDocumentFile } from '../../case/overview-data-handlers/examination-tab-handler.ts';

type JourneyAnswers = Journey['response']['answers'];
type ExaminationDocumentAnswers = JourneyAnswers & {
	status?: string | null;
	examinationWebsite?: string | null;
	examinationWebsiteUrl?: string | null;
	examinationDocumentFiles?: Record<string, ExaminationDocumentFile[]>;
};

// The LPA has not submitted for examination while the front office journey is in one of these states
const NOT_SUBMITTED_STATUSES = new Set<string>([
	EXAMINATION_STATUS_ID.CANNOT_START_YET,
	EXAMINATION_STATUS_ID.READY_TO_START,
	EXAMINATION_STATUS_ID.IN_PROGRESS
]);

const REQUIRED_FIELDS = Object.keys(EXAMINATION_REQUIRED_DOCUMENT_SETS);
const OTHER_FIELDS = Object.keys(EXAMINATION_OTHER_DOCUMENT_SETS);

/**
 * Read-only view of the documents (and examination website) the LPA submitted for examination in the front office.
 */
export default class CustomExaminationDocumentsQuestion extends Question {
	constructor({ ...params }) {
		super({
			...params,
			viewFolder: 'views/layouts/custom-examination-documents-viewer',
			title: params.title,
			question: params.question,
			fieldName: params.fieldName
		});
	}

	private getDocumentsCount(answers: ExaminationDocumentAnswers) {
		const documentFiles = answers?.examinationDocumentFiles ?? {};
		return [...REQUIRED_FIELDS, ...OTHER_FIELDS].reduce(
			(total, field) => total + (documentFiles[field]?.length ?? 0),
			0
		);
	}

	private isSubmitted(answers: ExaminationDocumentAnswers) {
		return !!answers?.status && !NOT_SUBMITTED_STATUSES.has(answers.status);
	}

	formatAnswerForSummary(sectionSegment: string, journey: Journey) {
		const answers: ExaminationDocumentAnswers = journey.response.answers ?? {};
		const documentCount = this.getDocumentsCount(answers);
		// The Review link is only offered once the LPA has submitted their documents
		const showReview = documentCount > 0 && this.isSubmitted(answers);
		return [
			{
				key: this.title,
				value: `${documentCount} document(s)`,
				action: showReview
					? {
							href: journey.getCurrentQuestionUrl(sectionSegment, this.fieldName),
							text: 'Review',
							visuallyHiddenText: this.title
						}
					: undefined
			}
		];
	}

	toViewModel(options: any) {
		const viewModel = super.toViewModel(options);
		const answers: ExaminationDocumentAnswers = options.journey.response.answers ?? {};
		const documentFiles = answers.examinationDocumentFiles ?? {};

		const downloadUrlFor = (file: ExaminationDocumentFile) =>
			`/case/${encodeURIComponent(options.params.reference)}/download-case-document/${encodeURIComponent(file.guid)}`;

		const toDocuments = (fields: string[]) =>
			fields.map((field) => ({
				label: EXAMINATION_DOCUMENT_LABELS[field] ?? field,
				files: (documentFiles[field] ?? []).map((file) => ({
					fileName: file.fileName,
					downloadUrl: downloadUrlFor(file)
				}))
			}));

		// The front office saves to examinationWebsiteUrl, the back office row saves to examinationWebsite
		const examinationWebsite = String(answers.examinationWebsiteUrl ?? answers.examinationWebsite ?? '').trim();
		const examinationWebsiteLink = examinationWebsite
			? {
					label: EXAMINATION_DOCUMENT_LABELS.examinationWebsite,
					text: examinationWebsite,
					// Prepend https:// when there is no scheme, matching the Examination website summary row
					href: /^https?:\/\//i.test(examinationWebsite) ? examinationWebsite : `https://${examinationWebsite}`
				}
			: undefined;

		return {
			...viewModel,
			documentGroups: [
				{
					id: 'required-documents',
					heading: 'Required',
					websiteLabel: EXAMINATION_DOCUMENT_LABELS.examinationWebsite,
					websiteLink: examinationWebsiteLink,
					showWebsite: true,
					documents: toDocuments(REQUIRED_FIELDS)
				},
				{
					id: 'other-documents',
					heading: 'Other',
					showWebsite: false,
					documents: toDocuments(OTHER_FIELDS)
				}
			]
		};
	}
}
