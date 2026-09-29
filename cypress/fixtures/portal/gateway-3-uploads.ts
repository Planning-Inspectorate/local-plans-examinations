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
		addCy: 'add-summary-of-consultation-on-proposed-local-plan-content-and-evidence'
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
	}
} as const satisfies Record<string, Gateway3UploadAnswer>;
