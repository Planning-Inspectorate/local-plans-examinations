import { Question } from '@planning-inspectorate/dynamic-forms/src/questions/question.js';
import { COMMON_CONSTS } from '../../../classes/common-consts.ts';
import type { Journey } from '@planning-inspectorate/dynamic-forms';
import {
	DOCUMENT_LABELS,
	OPTIONAL_DOCUMENT_SETS,
	REQUIRED_DOCUMENT_SETS
} from '@pins/local-plans-database/src/seed/static-data/ids/document-set.ts';
import type { Gateway3DocumentFile } from '../../case/overview-data-handlers/gateway-3-tab-handler.ts';

const { RESUBMISSION_DOCUMENTS_LABEL } = COMMON_CONSTS;

type JourneyAnswers = Journey['response']['answers'];
type ExtendedAnswers = JourneyAnswers & {
	optionalData?: Record<string, unknown>;
	resubmissionDocumentFiles?: Record<number, Gateway3DocumentFile[]>;
	[key: string]: unknown;
};

function countDocuments(value: unknown): number {
	if (Array.isArray(value)) return value.length;
	if (typeof value === 'string' && value.trim() !== '') return value.split(', ').length;
	return 0;
}

export default class CustomDocumentsQuestion extends Question {
	private config: { actionButtonVisibleInSummary: boolean };

	constructor({ ...params }) {
		super({
			...params,
			viewFolder: 'views/layouts/custom-documents-viewer',
			title: params.title,
			question: params.question,
			fieldName: params.fieldName
		});

		this.config = {
			actionButtonVisibleInSummary: true
		};
	}

	formatAnswerForSummary(sectionSegment: string, journey: Journey) {
		const answers = journey.response.answers ?? {};
		const submissionNumber = Number(sectionSegment.split('-').at(-1)) || 1;
		const documentCount = this.getDocumentsCount(journey.response.answers, submissionNumber);
		return [
			{
				key: this.title,
				value: `${documentCount} document(s)`,
				action: this.config.actionButtonVisibleInSummary ? this.getAction(sectionSegment, journey, answers) : undefined
			}
		];
	}

	private getDocumentsCount(answers: ExtendedAnswers, submissionNumber: number) {
		if (submissionNumber > 1) return answers.resubmissionDocumentFiles?.[submissionNumber]?.length ?? 0;
		const values = [
			...Object.keys(REQUIRED_DOCUMENT_SETS).map((key) => answers?.[key]),
			...Object.keys(OPTIONAL_DOCUMENT_SETS).map((key) => answers?.optionalData?.[key]),
			answers.examinationWebsite
		];
		return values.reduce((total: number, value) => total + countDocuments(value), 0);
	}

	public setActionLink(submissionId: string, reference: string, answers: ExtendedAnswers) {
		const submissionUrl = `/case/${reference}/${COMMON_CONSTS.GATEWAY_3_JOURNEY_ID}/gateway-3-submission-${submissionId}`;
		const documentCount = this.getDocumentsCount(answers, Number(submissionId));
		this.actionLink = {
			href: `${submissionUrl}/gateway-3-review-documents-${submissionId}`,
			text: documentCount > 0 ? 'Review' : ''
		};
	}

	toViewModel(options: any) {
		const submissionId = options.section.segment.split('-').at(-1);
		this.setActionLink(submissionId, options.params.reference!, options.journey.response.answers);
		const viewModel = super.toViewModel(options);
		const {
			journey: {
				response: { answers }
			}
		} = options;

		const NOT_PROVIDED = 'Not provided';

		const isBlank = (value: unknown) =>
			value === null || value === undefined || (typeof value === 'string' && value.trim() === '');

		const withNotAdded = (data: Record<string, unknown>) =>
			Object.fromEntries(Object.entries(data).map(([key, value]) => [key, isBlank(value) ? NOT_PROVIDED : value]));

		const viewAnswers = {
			...withNotAdded(answers),
			...(answers.optionalData && { optionalData: withNotAdded(answers.optionalData) })
		};

		const toRows = (fields: string[], data: Record<string, unknown> = {}) =>
			Object.fromEntries(fields.map((field) => [DOCUMENT_LABELS[field], data[field]]));

		const rowsMapRequiredData = toRows(['examinationWebsite', ...Object.keys(REQUIRED_DOCUMENT_SETS)], viewAnswers);
		const optionDataMap = toRows(Object.keys(OPTIONAL_DOCUMENT_SETS), viewAnswers.optionalData);

		const documentFiles: Record<string, Gateway3DocumentFile[]> = answers.documentFiles ?? {};
		const downloadUrlFor = (file: Gateway3DocumentFile) =>
			`/case/${encodeURIComponent(options.params.reference)}/download-case-document/${encodeURIComponent(file.guid)}`;

		const toFileRows = (fields: string[]) =>
			Object.fromEntries(
				fields.map((field) => [
					DOCUMENT_LABELS[field],
					(documentFiles[field] ?? []).map((file) => ({
						fileName: file.fileName,
						downloadUrl: downloadUrlFor(file)
					}))
				])
			);

		const requiredDocumentFiles = toFileRows(Object.keys(REQUIRED_DOCUMENT_SETS));
		const optionalDocumentFiles = toFileRows(Object.keys(OPTIONAL_DOCUMENT_SETS));

		// Prepend https:// when there is no scheme, matching the Examination website summary row
		const examinationWebsite = isBlank(answers.examinationWebsite) ? '' : String(answers.examinationWebsite).trim();
		const examinationWebsiteLink = examinationWebsite
			? {
					label: DOCUMENT_LABELS.examinationWebsite,
					text: examinationWebsite,
					href: /^https?:\/\//i.test(examinationWebsite) ? examinationWebsite : `https://${examinationWebsite}`
				}
			: undefined;

		const resubmissionFiles =
			Number(submissionId) > 1 ? (answers.resubmissionDocumentFiles?.[Number(submissionId)] ?? []) : null;
		const resubmissionDocumentFiles = resubmissionFiles && {
			[RESUBMISSION_DOCUMENTS_LABEL]: resubmissionFiles.map((file: any) => ({
				fileName: file.fileName,
				downloadUrl: downloadUrlFor(file)
			}))
		};

		const issueDecisionUrl = `/case/${options.params.reference}/gateway-3/${options.params.section}/gateway-3-decision-${submissionId}`;

		return {
			...viewModel,
			rowsMapRequiredData,
			optionDataMap,
			requiredDocumentFiles,
			optionalDocumentFiles,
			examinationWebsiteLink,
			resubmissionDocumentFiles,
			resubmissionDocumentData: { [RESUBMISSION_DOCUMENTS_LABEL]: '' },
			resubmissionDocumentsLabel: RESUBMISSION_DOCUMENTS_LABEL,
			issueDecisionUrl
		};
	}
}
