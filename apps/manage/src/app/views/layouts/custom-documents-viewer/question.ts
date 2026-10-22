import { Question } from '@planning-inspectorate/dynamic-forms/src/questions/question.js';

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

		const rowsMapRequiredData = {
			['Examination website']: viewAnswers.examinationWebsite,
			['Proposed local plan intended for submission for Examination']: viewAnswers.proposedLocalPlan,
			['Map of proposed local plan policies']: viewAnswers.mapOfPolicies,
			['Statement of Compliance']: viewAnswers.statementOfCompliance,
			['statement of Soundness']: viewAnswers.statementOfSoundness,
			['Summary of consultation and engagement activities and undertaken preparing of the proposed local plan ']:
				viewAnswers.consultationEngagementSummary,
			['Summary of Scoping  consultation']: viewAnswers.scopingConsultationSummary,
			['Summary of consultation of proposed local plan content of evidence']:
				viewAnswers.consultationContentEvidenceSummary,
			['Summary of consultation  on proposed local plan']: viewAnswers.consultationProposedPlanSummary,
			['Statement setting of out practical arrangements']: viewAnswers.practicalArrangementsStatement
		};

		const optionDataMap = {
			['Copies of representations']: viewAnswers.optionalData.copiesOfRepresentations,
			['Supplementary plans statement']: viewAnswers.optionalData.supplementaryPlansStatement,
			['Environment Report']: viewAnswers.optionalData.environmentalReport,
			['Statement of reasons for a determination that the proposed local plan is unlikely to have significant environmental effects']:
				viewAnswers.optionalData.statementOfReasonsDetermination,
			['Summary of representation relating to progress towards meeting prescribed requirements and the LPA response']:
				viewAnswers.optionalData.representationsProgressSummary,
			['Summary of gateway 2 assessor issues have been addressed']: viewAnswers.optionalData.gateway2IssuesSummary,
			['Statement explaining changes since proposed local plan consulation, reasons for those changes and, any additional consultation']:
				viewAnswers.optionalData.changesSinceConsultationStatement,
			['Other Documents']: viewAnswers.optionalData.otherDocuments
		};

		return {
			...viewModel,
			rowsMapRequiredData,
			optionDataMap
		};
	}
}
