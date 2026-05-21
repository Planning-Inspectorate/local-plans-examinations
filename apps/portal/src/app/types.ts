export type StageType = 0 | 1 | 2 | 3;
export type StatusType = 0 | 1 | 2 | 3 | 4 | 5;

export const StageLabel: Record<StageType, string> = {
	0: 'Gateway 1',
	1: 'Gateway 2',
	2: 'Gateway 3',
	3: 'Examination'
};

export const StatusLabel: Record<StatusType, string> = {
	0: 'Ready to start',
	1: 'In progress',
	2: 'With PINS',
	3: 'Action needed',
	4: 'Invalid',
	5: 'Completed'
};

export interface Plan {
	//BIG ? on name
	refNum: string; //Reference Number
	leadLPA: string; //Lead Local Planning Authority
	linkedLPA: string; //Linked Local Planning Authority
	title: string; //Plan Title
	stage: StageType; //Current Stage
	status: StatusType; //Status
	dates: string; //dates of gateways as listy thing but not actual list (to be split)
	sections: DocState[];
	documents: [ApplicationDoc];
}

export const StatusTag = {
	0: { label: 'Ready to Start', class: 'govuk-tag govuk-tag--green' },
	1: { label: 'In Progress', class: 'govuk-tag govuk-tag--blue' },
	2: { label: 'With PINS', class: 'govuk-tag govuk-tag--yellow' },
	3: { label: 'Action needed', class: 'govuk-tag govuk-tag--red' },
	4: { label: 'Invalid', class: 'govuk-tag govuk-tag--grey' },
	5: { label: 'Completed', class: 'govuk-body' }
} as const;

export type DocType = 0 | 1 | 2;
export type DocTitle = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;
export type DocState = 0 | 1 | 2;

export const DocStateTag = {
	0: { label: 'Not started', class: 'govuk-tag govuk-tag govuk-tag--grey' },
	1: { label: 'In Progress', class: 'govuk-tag govuk-tag govuk-tag--blue' },
	2: { label: 'Completed on', class: 'govuk-body' }
} as const;

export const DocStateLabel: Record<DocType, string> = {
	0: 'Not started',
	1: 'In progress',
	2: 'Completed on'
};

export const DocTypeLabel: Record<DocType, string> = {
	0: 'Procedural documents',
	1: 'Consultation documents',
	2: 'Submit'
};

export const docTitleLabel: Record<DocTitle, string> = {
	0: 'Gateway 2 cover letter', //Procedural documents
	1: 'Local plan timetable',
	2: 'Project initiation document',
	3: 'Draft statement of compliance',
	4: 'Draft statement of soundness',

	5: 'Consultation statement', //Consultation documents
	6: 'Consultation summary for scoping consultation',
	7: 'Consultation summary for proposed local plan content and evidence documents',
	8: 'Notice of intention to commence local plan preparation',
	9: 'Scoping consultation documents',
	10: 'Consultation summary of feedback to scoping consultation',
	11: 'Gateway 1 Self assessment of readiness',
	12: 'Consultation on proposed local plan content and evidence documents',
	13: 'Summary of consultation responses',

	14: 'Accept declaration and submit' //Submit
};

interface ApplicationDoc {
	title: DocTitle;
	type: DocType;
	file: null;
	state: DocState;
	dateCompleted: string | null;
}
