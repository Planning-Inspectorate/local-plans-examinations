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
}

export const StatusColour = {
	0: { label: 'Ready to Start', class: 'govuk-tag govuk-tag--green' },
	1: { label: 'In Progress', class: 'govuk-tag govuk-tag--blue' },
	2: { label: 'With PINS', class: 'govuk-tag govuk-tag--yellow' },
	3: { label: 'Action needed', class: 'govuk-tag govuk-tag--red' },
	4: { label: 'Invalid', class: 'govuk-tag govuk-tag--grey' },
	5: { label: 'Completed', class: 'govuk-body' }
} as const;
