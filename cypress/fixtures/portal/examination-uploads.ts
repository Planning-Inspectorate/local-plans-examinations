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
