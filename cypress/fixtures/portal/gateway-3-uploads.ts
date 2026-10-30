type Gateway3UploadAnswer = {
	heading: string;
	caption: string;
	fieldName: string;
	path: string;
	section: string;
	addCy: string;
};

export const gateway3UploadAnswers = {
	proposedLocalPlan: {
		heading: 'Upload your proposed local plan',
		caption: 'Required information',
		fieldName: 'proposedLocalPlan',
		path: 'proposed-local-plan',
		section: 'required-information',
		addCy: 'add-proposed-local-plan-intended-for-submission-for-examination'
	},
	mapOfProposedLocalPlanPolicies: {
		heading: 'Upload map of proposed local plan policies',
		caption: 'Required information',
		fieldName: 'mapOfPolicies',
		path: 'map-of-policies',
		section: 'required-information',
		addCy: 'add-map-of-proposed-local-plan-policies'
	},
	statementOfCompliance: {
		heading: 'Upload your Statement of Compliance',
		caption: 'Required information',
		fieldName: 'statementOfCompliance',
		path: 'statement-of-compliance',
		section: 'required-information',
		addCy: 'add-statement-of-compliance'
	},
	statementOfSoundness: {
		heading: 'Upload your Statement of Soundness',
		caption: 'Required information',
		fieldName: 'statementOfSoundness',
		path: 'statement-of-soundness',
		section: 'required-information',
		addCy: 'add-statement-of-soundness'
	},
	consultationEngagementSummary: {
		heading: 'Upload summary of consultation and engagement activities',
		caption: 'Required information',
		fieldName: 'consultationEngagementSummary',
		path: 'consultation-engagement-summary',
		section: 'required-information',
		addCy: 'add-summary-of-consultation-and-engagement-activities-undertaken-in-preparing-the-proposed-local-plan'
	},
	scopingConsultationSummary: {
		heading: 'Upload summary of scoping consultation',
		caption: 'Required information',
		fieldName: 'scopingConsultationSummary',
		path: 'scoping-consultation-summary',
		section: 'required-information',
		addCy: 'add-summary-of-scoping-consultation'
	},
	consultationContentEvidenceSummary: {
		heading: 'Upload summary of consultation on proposed local plan content and evidence',
		caption: 'Required information',
		fieldName: 'consultationContentEvidenceSummary',
		path: 'consultation-content-evidence-summary',
		section: 'required-information',
		addCy: 'add-summary-of-consultation-on-proposed-local-plan-content-and-evidence-documents'
	},
	consultationProposedPlanSummary: {
		heading: 'Upload summary of consultation on proposed local plan',
		caption: 'Required information',
		fieldName: 'consultationProposedPlanSummary',
		path: 'consultation-proposed-plan-summary',
		section: 'required-information',
		addCy: 'add-summary-of-consultation-on-proposed-local-plan'
	},
	practicalArrangementsStatement: {
		heading: 'Upload your statement of practical arrangements demonstrating readiness for examination',
		caption: 'Required information',
		fieldName: 'practicalArrangementsStatement',
		path: 'practical-arrangements-statement',
		section: 'required-information',
		addCy: 'add-statement-setting-out-practical-arrangements-demonstrating-readiness-for-examination'
	},
	environmentalReport: {
		heading: 'Upload your environmental report',
		caption: 'Optional documents',
		fieldName: 'environmentalReport',
		path: 'environmental-report',
		section: 'optional-documents',
		addCy: 'add-environmental-report'
	},
	resubmissionDocuments: {
		heading: 'Upload any new or updated documents',
		caption: 'Additional documents',
		fieldName: 'resubmissionDocuments',
		path: 'additional-documents',
		section: 'gateway-3-resubmission',
		addCy: 'add-documents'
	}
} as const satisfies Record<string, Gateway3UploadAnswer>;

export const gateway3ApplicationDocuments = {
	required: [
		{ document: 'Examination website', addCy: 'add-examination-website' },
		{
			document: 'Proposed local plan intended for submission for examination',
			addCy: gateway3UploadAnswers.proposedLocalPlan.addCy
		},
		{
			document: 'Map of proposed local plan policies',
			addCy: gateway3UploadAnswers.mapOfProposedLocalPlanPolicies.addCy
		},
		{ document: 'Statement of Compliance', addCy: gateway3UploadAnswers.statementOfCompliance.addCy },
		{ document: 'Statement of Soundness', addCy: gateway3UploadAnswers.statementOfSoundness.addCy },
		{
			document: 'Summary of consultation and engagement activities undertaken in preparing the proposed local plan',
			addCy: gateway3UploadAnswers.consultationEngagementSummary.addCy
		},
		{ document: 'Summary of scoping consultation', addCy: gateway3UploadAnswers.scopingConsultationSummary.addCy },
		{
			document: 'Summary of consultation on proposed local plan content and evidence',
			addCy: gateway3UploadAnswers.consultationContentEvidenceSummary.addCy
		},
		{
			document: 'Summary of consultation on proposed local plan',
			addCy: gateway3UploadAnswers.consultationProposedPlanSummary.addCy
		},
		{
			document: 'Statement setting out practical arrangements demonstrating readiness for examination',
			addCy: gateway3UploadAnswers.practicalArrangementsStatement.addCy
		}
	],
	optional: [
		{ document: 'Copies of representations', addCy: 'add-copies-of-representations' },
		{ document: 'Supplementary plans statement', addCy: 'add-supplementary-plans-statement' },
		{ document: 'Environmental report', addCy: gateway3UploadAnswers.environmentalReport.addCy },
		{
			document:
				'Statement of reasons for a determination that the proposed local plan is unlikely to have significant environmental effects',
			addCy: 'add-statement-of-reasons-determination'
		},
		{
			document:
				'Summary of representations relating to progress towards meeting prescribed requirements and the LPA response',
			addCy: 'add-representations-progress-summary'
		},
		{
			document: 'Summary of how Gateway 2 assessor issues have been addressed',
			addCy: 'add-summary-of-how-gateway-2-assessor-issues-have-been-addressed'
		},
		{
			document:
				'Statement explaining changes since the proposed local plan consultation, reasons for those changes, and any additional consultation',
			addCy: 'add-changes-since-consultation-statement'
		},
		{ document: 'Other documents', addCy: 'add-other-documents' }
	]
};
