type ExaminationUploadAnswer = {
	heading: string;
	fieldName: string;
	path: string;
	addCy: string;
};

export const examinationUploadAnswers = {
	localPlanSubmissionForExamination: {
		heading: 'Upload local plan submission for examination',
		fieldName: 'localPlanSubmission',
		path: 'local-plan-submission',
		addCy: 'add-local-plan-submission-for-examination'
	},
	mapOfProposedLocalPlanPolicies: {
		heading: 'Upload map of proposed local plan policies',
		fieldName: 'mapOfPolicies',
		path: 'map-of-proposed-local-plan-policies',
		addCy: 'add-map-of-proposed-local-plan-policies'
	},
	gateway3CompletionStatement: {
		heading: 'Upload gateway 3 completion statement',
		fieldName: 'gateway3CompletionStatement',
		path: 'gateway-3-completion-statement',
		addCy: 'add-gateway-3-completion-statement'
	},
	consultationEngagementSummary: {
		heading: 'Upload summary of consultation and engagement activities in preparing the proposed local plan',
		fieldName: 'consultationEngagementSummary',
		path: 'consultation-engagement-activities',
		addCy: 'add-summary-of-consultation-and-engagement-activities-in-preparing-the-proposed-local-plan'
	},
	consultationProposedPlanSummary: {
		heading: 'Upload summary of consultation on proposed local plan',
		fieldName: 'consultationProposedPlanSummary',
		path: 'consultation-on-proposed-local-plan',
		addCy: 'add-summary-of-consultation-on-proposed-local-plan'
	},
	statementOfCompliance: {
		heading: 'Upload statement of compliance',
		fieldName: 'statementOfCompliance',
		path: 'statement-of-compliance',
		addCy: 'add-statement-of-compliance'
	},
	statementOfSoundness: {
		heading: 'Upload statement of soundness',
		fieldName: 'statementOfSoundness',
		path: 'statement-of-soundness',
		addCy: 'add-statement-of-soundness'
	}
} as const satisfies Record<string, ExaminationUploadAnswer>;

export const examinationApplicationDocuments = {
	required: [
		{ document: 'Examination website', addCy: 'add-examination-website' },
		{
			document: 'Local plan submission for examination',
			addCy: examinationUploadAnswers.localPlanSubmissionForExamination.addCy
		},
		{
			document: 'Map of proposed local plan policies',
			addCy: examinationUploadAnswers.mapOfProposedLocalPlanPolicies.addCy
		},
		{ document: 'Gateway 3 completion statement', addCy: examinationUploadAnswers.gateway3CompletionStatement.addCy },
		{
			document: 'Summary of consultation and engagement activities in preparing the proposed local plan',
			addCy: examinationUploadAnswers.consultationEngagementSummary.addCy
		},
		{
			document: 'Summary of consultation on proposed local plan',
			addCy: examinationUploadAnswers.consultationProposedPlanSummary.addCy
		},
		{ document: 'Statement of compliance', addCy: examinationUploadAnswers.statementOfCompliance.addCy },
		{ document: 'Statement of soundness', addCy: examinationUploadAnswers.statementOfSoundness.addCy }
	],
	optional: [
		{
			document: 'Representations on conformity with an operative spatial development strategy',
			addCy: 'add-representations-on-conformity-with-an-operative-spatial-development-strategy'
		},
		{ document: 'Environmental report', addCy: 'add-environmental-report' },
		{
			document:
				'Statement demonstrating that the proposed local plan is unlikely to have significant environmental effects',
			addCy:
				'add-statement-demonstrating-that-the-proposed-local-plan-is-unlikely-to-have-significant-environmental-effects'
		},
		{ document: 'Additional evidence documents', addCy: 'add-additional-evidence-documents' },
		{
			document:
				'Statement explaining changes made since Gateway 3 assessment and details of any additional consultations',
			addCy:
				'add-statement-explaining-changes-made-since-gateway-3-assessment-and-details-of-any-additional-consultations'
		},
		{
			document: 'Representations required in the Gateway 3 report',
			addCy: 'add-representations-required-in-the-gateway-3-report'
		}
	]
};
