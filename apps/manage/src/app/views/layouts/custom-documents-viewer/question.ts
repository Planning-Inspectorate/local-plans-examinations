import { Question } from '@planning-inspectorate/dynamic-forms/src/questions/question.js';
import { DOCUMENT_SET_ID } from '@pins/local-plans-database/src/seed/static-data/ids/index.ts';

export const REQUIRED_DOCUMENT_SETS = {
	proposedLocalPlan: DOCUMENT_SET_ID.G3_PROPOSED_LOCAL_PLAN,
	mapOfPolicies: DOCUMENT_SET_ID.G3_MAP_OF_POLICIES,
	statementOfCompliance: DOCUMENT_SET_ID.G3_STATEMENT_OF_COMPLIANCE,
	statementOfSoundness: DOCUMENT_SET_ID.G3_STATEMENT_OF_SOUNDNESS,
	consultationEngagementSummary: DOCUMENT_SET_ID.G3_CONSULTATION_ENGAGEMENT_SUMMARY,
	scopingConsultationSummary: DOCUMENT_SET_ID.G3_SCOPING_CONSULTATION_SUMMARY,
	consultationContentEvidenceSummary: DOCUMENT_SET_ID.G3_CONSULTATION_CONTENT_EVIDENCE_SUMMARY,
	consultationProposedPlanSummary: DOCUMENT_SET_ID.G3_CONSULTATION_PROPOSED_PLAN_SUMMARY,
	practicalArrangementsStatement: DOCUMENT_SET_ID.G3_PRACTICAL_ARRANGEMENTS_STATEMENT
};
export const OPTIONAL_DOCUMENT_SETS = {
	copiesOfRepresentations: DOCUMENT_SET_ID.G3_COPIES_OF_REPRESENTATIONS,
	supplementaryPlansStatement: DOCUMENT_SET_ID.G3_SUPPLEMENTARY_PLANS_STATEMENT,
	environmentalReport: DOCUMENT_SET_ID.G3_ENVIRONMENTAL_REPORT,
	statementOfReasonsDetermination: DOCUMENT_SET_ID.G3_STATEMENT_OF_REASONS_DETERMINATION,
	representationsProgressSummary: DOCUMENT_SET_ID.G3_REPRESENTATIONS_PROGRESS_SUMMARY,
	gateway2IssuesSummary: DOCUMENT_SET_ID.G3_GATEWAY_2_ISSUES_SUMMARY,
	changesSinceConsultationStatement: DOCUMENT_SET_ID.G3_CHANGES_SINCE_CONSULTATION_STATEMENT,
	otherDocuments: DOCUMENT_SET_ID.G3_OTHER_DOCUMENTS
};

export const DOCUMENT_LABELS: Record<string, string> = {
	examinationWebsite: 'Examination website',
	proposedLocalPlan: 'Proposed local plan intended for submission for examination',
	mapOfPolicies: 'Map of proposed local plan policies',
	statementOfCompliance: 'Statement of compliance',
	statementOfSoundness: 'Statement of soundness',
	consultationEngagementSummary:
		'Summary of consultation and engagement activities undertaken in preparing the proposed local plan',
	scopingConsultationSummary: 'Summary of scoping consultation',
	consultationContentEvidenceSummary: 'Summary of consultation on proposed local plan content and evidence',
	consultationProposedPlanSummary: 'Summary of consultation on proposed local plan',
	practicalArrangementsStatement: 'Statement setting out practical arrangements',
	copiesOfRepresentations: 'Copies of representations',
	supplementaryPlansStatement: 'Supplementary plans statement',
	environmentalReport: 'Environmental report',
	statementOfReasonsDetermination:
		'Statement of reasons for a determination that the proposed local plan is unlikely to have significant environmental effects',
	representationsProgressSummary:
		'Summary of representations relating to progress towards meeting prescribed requirements and the LPA response',
	gateway2IssuesSummary: 'Summary of how Gateway 2 assessor issues have been addressed',
	changesSinceConsultationStatement:
		'Statement explaining changes since proposed local plan consultation, reasons for those changes and any additional consultation',
	otherDocuments: 'Other documents'
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

	formatAnswerForSummary(sectionSegment: string, journey: any, answer: unknown) {
		const answers = journey.response.answers ?? {};
		const values = [
			...Object.keys(REQUIRED_DOCUMENT_SETS).map((key) => answers[key]),
			...Object.keys(OPTIONAL_DOCUMENT_SETS).map((key) => answers.optionalData?.[key])
		];
		const documentCount = values.reduce((total: number, value) => total + countDocuments(value), 0);

		return [
			{
				key: this.title,
				value: `${documentCount} document(s)`,
				action: this.getAction(sectionSegment, journey, answer)
			}
		];
	}

	toViewModel(options: any) {
		const viewModel = super.toViewModel(options);
		const {
			journey: {
				response: { answers }
			}
		} = options;

		const NOT_ADDED = 'not added';

		const isBlank = (value: unknown) =>
			value === null || value === undefined || (typeof value === 'string' && value.trim() === '');

		const withNotAdded = (data: Record<string, unknown>) =>
			Object.fromEntries(Object.entries(data).map(([key, value]) => [key, isBlank(value) ? NOT_ADDED : value]));

		const viewAnswers = {
			...withNotAdded(answers),
			...(answers.optionalData && { optionalData: withNotAdded(answers.optionalData) })
		};

		const toRows = (fields: string[], data: Record<string, unknown> = {}) =>
			Object.fromEntries(fields.map((field) => [DOCUMENT_LABELS[field], data[field]]));

		const rowsMapRequiredData = toRows(['examinationWebsite', ...Object.keys(REQUIRED_DOCUMENT_SETS)], viewAnswers);
		const optionDataMap = toRows(Object.keys(OPTIONAL_DOCUMENT_SETS), viewAnswers.optionalData);

		const submissionId = options.section.segment.split('-').at(-1);
		const issueDecisionUrl = `/case/${options.params.reference}/gateway-3/${options.params.section}/gateway-3-decision-${submissionId}`;

		return {
			...viewModel,
			rowsMapRequiredData,
			optionDataMap,
			issueDecisionUrl
		};
	}
}
