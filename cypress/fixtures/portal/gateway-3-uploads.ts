type Gateway3UploadAnswer = {
	heading: string;
	caption: string;
	fieldName: string;
	path: string;
	section: string;
	addCy: string;
};

export const gateway3UploadAnswers = {
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
	}
} as const satisfies Record<string, Gateway3UploadAnswer>;
