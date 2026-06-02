//types

export const validStageTypes = [0, 1, 2, 3] as const;
export type StageType = (typeof validStageTypes)[number];

export const validStatusTypes = [0, 1, 2, 3, 4, 5] as const;
export type StatusType = (typeof validStatusTypes)[number];

export const validStates = [0, 1, 2] as const;
export type State = (typeof validStates)[number];

export const validDocTypes = [0, 1, 2] as const;
export type DocType = (typeof validDocTypes)[number];

export const validDocTitles = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14] as const;
export type DocTitle = (typeof validDocTitles)[number];

//labels

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

export const StateLabel: Record<DocType, string> = {
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

//tags

export const StatusTag = {
	0: { label: 'Ready to Start', class: 'govuk-tag govuk-tag--green' },
	1: { label: 'In Progress', class: 'govuk-tag govuk-tag--blue' },
	2: { label: 'With PINS', class: 'govuk-tag govuk-tag--yellow' },
	3: { label: 'Action needed', class: 'govuk-tag govuk-tag--red' },
	4: { label: 'Invalid', class: 'govuk-tag govuk-tag--grey' },
	5: { label: 'Completed', class: 'govuk-body' }
} as const;

export const StateTag = {
	0: { label: 'Not started', class: 'govuk-tag govuk-tag govuk-tag--grey' },
	1: { label: 'In Progress', class: 'govuk-tag govuk-tag govuk-tag--blue' },
	2: { label: 'Completed on', class: 'govuk-body' }
} as const;

//interfaces

interface ApplicationDoc {
	title: DocTitle;
	type: DocType;
	file: null;
	state: State;
	dateCompleted: string | null;
}

export interface Plan {
	//BIG ? on name
	refNum: string; //Reference Number
	leadLPA: string; //Lead Local Planning Authority
	linkedLPA: string; //Linked Local Planning Authority
	title: string; //Plan Title
	stage: StageType; //Current Stage
	status: StatusType; //Status
	dates: string; //dates of gateways as listy thing but not actual list (to be split) e.g. "7 May 2026|21 July 2026|August 2026|September 2026"
	sections: State[]; // track which state each gateway is array of state e.g. [0,0,0]
	documents: ApplicationDoc[]; // holds interfaces of each doc needed
}

function validApplicationDoc(rawApplicationDoc: unknown): rawApplicationDoc is ApplicationDoc {
	if (typeof rawApplicationDoc !== 'object' || rawApplicationDoc === null) return false;

	const applicationDoc = rawApplicationDoc as Record<string, unknown>;

	const validTitle = (title: unknown): title is DocTitle => validDocTitles.includes(title as DocTitle);

	const validType = (type: unknown): type is DocType => validDocTypes.includes(type as DocType);

	const validState = (state: unknown): state is State => validStates.includes(state as State);

	return (
		validTitle(applicationDoc.title) &&
		validType(applicationDoc.type) &&
		applicationDoc.file === null &&
		validState(applicationDoc.state) &&
		(applicationDoc.dateCompleted === null || applicationDoc.dateCompleted === 'string')
	);
}

export function validPlan(rawPlan: unknown): rawPlan is Plan {
	if (typeof rawPlan !== 'object' || rawPlan === null) return false;

	const plan = rawPlan as Record<string, unknown>;

	const validStage = (stage: unknown): stage is StageType => validStageTypes.includes(stage as StageType);

	const validStatus = (status: unknown): status is StatusType => validStatusTypes.includes(status as StatusType);

	const validState = (state: unknown): state is State => validStates.includes(state as State);

	const validSections = (section: unknown): section is State[] =>
		Array.isArray(section) && section.length === 3 && section.every(validState);

	return (
		typeof plan.refNum === 'string' &&
		typeof plan.leadLPA === 'string' &&
		typeof plan.linkedLPA === 'string' &&
		typeof plan.title === 'string' &&
		validStage(plan.stage) &&
		validStatus(plan.status) &&
		typeof plan.dates === 'string' &&
		validSections(plan.sections) &&
		Array.isArray(plan.documents) &&
		plan.documents.every(validApplicationDoc)
	);
}
