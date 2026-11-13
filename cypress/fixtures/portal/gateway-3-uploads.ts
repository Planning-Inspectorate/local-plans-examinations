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
		heading: 'Upload your proposed local plan submission for examination',
		caption: 'Plan content, evidence and background',
		fieldName: 'proposedLocalPlan',
		path: 'proposed-local-plan',
		section: 'plan-content-evidence-and-background',
		addCy: 'add-proposed-local-plan-submission-for-examination'
	},
	mapOfProposedLocalPlanPolicies: {
		heading: 'Upload your map of proposed local plan policies',
		caption: 'Plan content, evidence and background',
		fieldName: 'mapOfPolicies',
		path: 'map-of-policies',
		section: 'plan-content-evidence-and-background',
		addCy: 'add-map-of-proposed-local-plan-policies'
	},
	statementOfCompliance: {
		heading: 'Upload your statement of compliance',
		caption: 'Procedural documents',
		fieldName: 'statementOfCompliance',
		path: 'statement-of-compliance',
		section: 'procedural-documents',
		addCy: 'add-statement-of-compliance'
	},
	statementOfSoundness: {
		heading: 'Upload your statement of soundness',
		caption: 'Procedural documents',
		fieldName: 'statementOfSoundness',
		path: 'statement-of-soundness',
		section: 'procedural-documents',
		addCy: 'add-statement-of-soundness'
	},
	consultationEngagementSummary: {
		heading: 'Upload your summary of consultation and engagement activities in preparing the proposed local plan',
		caption: 'Consultation documents',
		fieldName: 'consultationEngagementSummary',
		path: 'consultation-engagement-summary',
		section: 'consultation-documents',
		addCy: 'add-summary-of-consultation-and-engagement-activities-in-preparing-the-proposed-local-plan'
	},
	scopingConsultationSummary: {
		heading: 'Upload your summary of scoping consultation',
		caption: 'Consultation documents',
		fieldName: 'scopingConsultationSummary',
		path: 'scoping-consultation-summary',
		section: 'consultation-documents',
		addCy: 'add-summary-of-scoping-consultation'
	},
	consultationContentEvidenceSummary: {
		heading: 'Upload your summary of consultation on proposed local plan content and evidence',
		caption: 'Consultation documents',
		fieldName: 'consultationContentEvidenceSummary',
		path: 'consultation-content-evidence-summary',
		section: 'consultation-documents',
		addCy: 'add-summary-of-consultation-on-proposed-local-plan-content-and-evidence'
	},
	consultationProposedPlanSummary: {
		heading: 'Upload your summary of consultation on proposed local plan',
		caption: 'Procedural documents',
		fieldName: 'consultationProposedPlanSummary',
		path: 'consultation-proposed-plan-summary',
		section: 'procedural-documents',
		addCy: 'add-summary-of-consultation-on-proposed-local-plan'
	},
	practicalArrangementsStatement: {
		heading: 'Upload your practical arrangements demonstrating readiness for examination',
		caption: 'Plan content, evidence and background',
		fieldName: 'practicalArrangementsStatement',
		path: 'practical-arrangements-statement',
		section: 'plan-content-evidence-and-background',
		addCy: 'add-practical-arrangements-demonstrating-readiness-for-examination'
	},
	environmentalReport: {
		heading: 'Upload your environmental report',
		caption: 'Plan content, evidence and background',
		fieldName: 'environmentalReport',
		path: 'environmental-report',
		section: 'plan-content-evidence-and-background',
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
	procedural: [
		{ document: 'Statement of compliance', addCy: gateway3UploadAnswers.statementOfCompliance.addCy },
		{ document: 'Statement of soundness', addCy: gateway3UploadAnswers.statementOfSoundness.addCy },
		{
			document: 'Summary of how Gateway 2 assessor issues have been addressed',
			addCy: 'add-summary-of-how-gateway-2-assessor-issues-have-been-addressed'
		},
		{
			document:
				'Statement explaining changes since the proposed local plan consultation, reasons for changes, any additional consultations',
			addCy: 'add-changes-since-consultation-statement'
		},
		{
			document: 'Summary of consultation on proposed local plan',
			addCy: gateway3UploadAnswers.consultationProposedPlanSummary.addCy
		}
	],
	consultation: [
		{
			document: 'Summary of representations and responses on meeting prescribed requirements',
			addCy: 'add-representations-progress-summary'
		},
		{ document: 'Representations', addCy: 'add-representations' },
		{
			document: 'Summary of consultation and engagement activities in preparing the proposed local plan',
			addCy: gateway3UploadAnswers.consultationEngagementSummary.addCy
		},
		{ document: 'Summary of scoping consultation', addCy: gateway3UploadAnswers.scopingConsultationSummary.addCy },
		{
			document: 'Summary of consultation on proposed local plan content and evidence',
			addCy: gateway3UploadAnswers.consultationContentEvidenceSummary.addCy
		}
	],
	planContent: [
		{
			document: 'Proposed local plan submission for examination',
			addCy: gateway3UploadAnswers.proposedLocalPlan.addCy
		},
		{ document: 'Examination website', addCy: 'add-examination-website' },
		{
			document: 'Practical arrangements demonstrating readiness for examination',
			addCy: gateway3UploadAnswers.practicalArrangementsStatement.addCy
		},
		{ document: 'Environmental report', addCy: gateway3UploadAnswers.environmentalReport.addCy },
		{
			document:
				'Statement demonstrating that the proposed local plan is unlikely to have significant environmental effects',
			addCy: 'add-statement-of-reasons-determination'
		},
		{ document: 'Supporting material', addCy: 'add-supporting-material' },
		{
			document: 'Map of proposed local plan policies',
			addCy: gateway3UploadAnswers.mapOfProposedLocalPlanPolicies.addCy
		},
		{ document: 'Supplementary plans statement', addCy: 'add-supplementary-plans-statement' }
	]
};
