export const planTitle = {
	row: 'Plan title',
	path: 'plan-title',
	value: 'Cypress Test Plan',
	display: 'Cypress Test Plan',
	updatedValue: 'Updated Cypress Test Plan'
} as const;

export const planType = {
	row: 'Plan type',
	path: 'plan-type',
	display: 'Local Plan',
	updatedValue: 'other',
	updatedDisplay: 'Other'
} as const;

export const localPlanningAuthority = {
	row: 'Local Planning Authority',
	path: 'local-planning-authority',
	lpa1Value: 'Local Planning Authority 1',
	lpa2Value: 'Local Planning Authority 2'
} as const;

export const caseOfficer = {
	row: 'Case officer',
	path: 'case-officer',
	display: 'Case Officer 1'
} as const;

export const planBand = {
	row: 'Plan band',
	path: 'plan-band',
	heading: 'What is the plan band?',
	display: 'Not started'
} as const;

export const contactDetails = {
	row: 'Contact details',
	path: 'contact-details',
	heading: 'Contact details',
	updatedContactDetails: {
		firstName: 'Updated',
		lastName: 'Contact',
		email: 'updated.contact@example.com',
		phone: '02079460001'
	}
} as const;

export const programmeOfficer = {
	row: 'Programme Officer details',
	path: 'programme-officer',
	heading: 'Programme Officer details',
	fieldFirstName: 'programmeOfficerFirstName',
	fieldLastName: 'programmeOfficerLastName',
	fieldEmail: 'programmeOfficerEmail',
	values: {
		firstName: 'Albert',
		lastName: 'Einstien',
		email: 'gateway3.officer@test.com'
	},
	updatedValues: {
		firstName: 'Programme',
		lastName: 'Officer 1',
		email: 'programme.officer1@example.com'
	}
} as const;

export const examinationWebsite = {
	row: 'Examination website',
	path: 'examination-website',
	heading: 'What is the address of the examination website?',
	field: 'examinationWebsite',
	value: 'https://www.gov.uk/'
} as const;

export const assessorGateway2 = {
	row: 'Assessor Gateway 2',
	path: 'assessor-gateway-2',
	heading: 'Who is the Gateway 2 assessor?',
	field: 'assessorName',
	value: 'Assessor 1'
} as const;

export const assessorGateway3 = {
	row: 'Assessor Gateway 3',
	path: 'assessor-gateway-3',
	heading: 'Who is the Gateway 3 assessor?',
	field: 'assessorGateway3'
} as const;

export const examiningInspector1 = {
	row: 'Examining Inspector 1',
	path: 'examining-inspector-1',
	heading: 'Which Inspector is assigned for Examination?',
	field: 'examiningInspector1',
	value: 'Inspector 1'
} as const;

export const examiningInspector2 = {
	row: 'Examining Inspector 2',
	path: 'examining-inspector-2',
	heading: 'Which Inspector is assigned for Examination?',
	field: 'examiningInspector2'
} as const;

export const examiningInspector3 = {
	row: 'Examining Inspector 3',
	path: 'examining-inspector-3',
	heading: 'Which Inspector is assigned for Examination?',
	field: 'examiningInspector3'
} as const;

export const qaInspector1 = {
	row: 'QA Inspector 1',
	path: 'qa-inspector-1',
	heading: 'Which Inspector is assigned for QA?',
	field: 'qaInspector1',
	value: 'Inspector 1'
} as const;

export const qaInspector2 = {
	row: 'QA Inspector 2',
	path: 'qa-inspector-2',
	heading: 'Which Inspector is assigned for QA?',
	field: 'qaInspector2'
} as const;

export const qaInspector3 = {
	row: 'QA Inspector 3',
	path: 'qa-inspector-3',
	heading: 'Which Inspector is assigned for QA?',
	field: 'qaInspector3'
} as const;

export const overviewExpectedAnswers = [
	{ row: planTitle.row, display: planTitle.display },
	{ row: planType.row, display: planType.display },
	{ row: caseOfficer.row, display: caseOfficer.display },
	{ row: planBand.row, display: planBand.display }
];
export const overviewSummaryRows = [
	{ row: planTitle.row },
	{ row: planType.row },
	{ row: caseOfficer.row },
	{ row: planBand.row },
	{ row: localPlanningAuthority.row },
	{ row: contactDetails.row },
	{ row: programmeOfficer.row },
	{ row: examinationWebsite.row },
	{ row: examiningInspector1.row },
	{ row: examiningInspector2.row },
	{ row: examiningInspector3.row },
	{ row: assessorGateway2.row },
	{ row: assessorGateway3.row },
	{ row: qaInspector1.row },
	{ row: qaInspector2.row },
	{ row: qaInspector3.row }
];
