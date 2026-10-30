import { Question } from '@planning-inspectorate/dynamic-forms/src/questions/question.js';
import { COMMON_CONSTS } from '../../../classes/common-consts.ts';
import type { Journey } from '@planning-inspectorate/dynamic-forms';
import {
	DOCUMENT_LABELS,
	OPTIONAL_DOCUMENT_SETS,
	REQUIRED_DOCUMENT_SETS
} from '@pins/local-plans-database/src/seed/static-data/ids/document-set.ts';

type JourneyAnswers = Journey['response']['answers'];
type ExtendedAnswers = JourneyAnswers & {
	optionalData?: Record<string, unknown>;
	[key: string]: unknown;
};

function countDocuments(value: unknown): number {
	if (Array.isArray(value)) return value.length;
	if (typeof value === 'string' && value.trim() !== '') return value.split(', ').length;
	return 0;
}

export default class CustomDocumentsQuestion extends Question {
	private config = {};

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
		const documentCount = this.getDocumentsCount(journey.response.answers);
		return [
			{
				key: this.title,
				value: `${documentCount} document(s)`,
				action: this.getAction(sectionSegment, journey, answers)
			}
		];
	}

	private getDocumentsCount(answers: ExtendedAnswers) {
		const values = [
			...Object.keys(REQUIRED_DOCUMENT_SETS).map((key) => answers?.[key]),
			...Object.keys(OPTIONAL_DOCUMENT_SETS).map((key) => answers?.optionalData?.[key]),
			answers.examinationWebsite
		];
		return values.reduce((total: number, value) => total + countDocuments(value), 0);
	}

	public setActionLink(submissionId: string, reference: string, answers: ExtendedAnswers) {
		const submissionUrl = `/case/${reference}/${COMMON_CONSTS.GATEWAY_3_JOURNEY_ID}/gateway-3-submission-${submissionId}`;
		const documentCount = this.getDocumentsCount(answers);
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

		const issueDecisionUrl = `/case/${options.params.reference}/gateway-3/${options.params.section}/gateway-3-decision-${submissionId}`;

		return {
			...viewModel,
			rowsMapRequiredData,
			optionDataMap,
			issueDecisionUrl
		};
	}
}
