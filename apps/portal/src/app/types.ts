//stage constants: which stage of the plan the case is in
export const STAGE = {
	Gateway1: 0,
	Gateway2: 1,
	Gateway3: 2,
	Examination: 3
} as const;

//status constants: the status of the current stage
export const STATUS = {
	ReadyToStart: 0,
	InProgress: 1,
	WithPINS: 2,
	ActionNeeded: 3,
	Invalid: 4,
	Completed: 5
} as const;

//state constants: the state of an individual document/section
export const STATE = {
	NotStarted: 0,
	InProgress: 1,
	Completed: 2
} as const;

//types

export const validStageTypes = [0, 1, 2, 3] as const;
export type Stage = (typeof validStageTypes)[number];

export const validStatusTypes = [0, 1, 2, 3, 4, 5] as const;
export type Status = (typeof validStatusTypes)[number];

export const validStates = [0, 1, 2] as const;
export type State = (typeof validStates)[number];

export const validDocTypes = [0, 1, 2] as const;
export type DocType = (typeof validDocTypes)[number];

export const validDocTitles = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14] as const;
export type DocTitle = (typeof validDocTitles)[number];

//labels

export const StageLabel: Record<Stage, string> = {
	0: 'Gateway 1',
	1: 'Gateway 2',
	2: 'Gateway 3',
	3: 'Examination'
};

export const StatusLabel: Record<Status, string> = {
	0: 'Ready to start',
	1: 'In progress',
	2: 'With PINS',
	3: 'Action needed',
	4: 'Invalid',
	5: 'Completed'
};

export const StateLabel: Record<State, string> = {
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
	0: { label: 'Ready to start', class: 'govuk-tag govuk-tag--green' },
	1: { label: 'In progress', class: 'govuk-tag govuk-tag--blue' },
	2: { label: 'With PINS', class: 'govuk-tag govuk-tag--yellow' },
	3: { label: 'Action needed', class: 'govuk-tag govuk-tag--red' },
	4: { label: 'Invalid', class: 'govuk-tag govuk-tag--grey' },
	5: { label: 'Completed', class: 'govuk-body' }
} as const;

export const StateTag = {
	0: { label: 'Not started', class: 'govuk-tag govuk-tag govuk-tag--grey' },
	1: { label: 'In progress', class: 'govuk-tag govuk-tag govuk-tag--blue' },
	2: { label: 'Completed on', class: 'govuk-body' }
} as const;

//interfaces

export interface ApplicationDoc {
	title: DocTitle; //title of document
	type: DocType; // which stage belongs to
	file: null; // will be for file when implemented
	state: State; //state of stage
	dateCompleted: string | null; //when completed
}

export interface Plan {
	//BIG ? on name
	refNum: string; //Reference Number
	leadLPA: string; //Lead Local Planning Authority
	linkedLPA: string; //Linked Local Planning Authority
	title: string; //Plan Title
	stage: Stage; //Current Stage
	status: Status; //Status
	dates: {
		//dates of gateways as obj  e.g. "G1: 7 May 2026, G2: 21 July 2026, G3: August 2026, E: September 2026"
		G1: string;
		G2: string;
		G3: string;
		E: string;
	};
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
		(applicationDoc.dateCompleted === null || typeof applicationDoc.dateCompleted === 'string')
	);
}

export function validPlan(rawPlan: unknown): rawPlan is Plan {
	if (typeof rawPlan !== 'object' || rawPlan === null) return false;

	const plan = rawPlan as Record<string, unknown>;

	const validStage = (stage: unknown): stage is Stage => validStageTypes.includes(stage as Stage);

	const validStatus = (status: unknown): status is Status => validStatusTypes.includes(status as Status);

	const validState = (state: unknown): state is State => validStates.includes(state as State);

	const validSections = (section: unknown): section is State[] =>
		Array.isArray(section) && section.length === 3 && section.every(validState);

	// TODO: need to check date format when we find out the format from BO
	const dateStages = ['G1', 'G2', 'G3', 'E'];
	const validDates = (date: unknown) =>
		date !== null &&
		typeof date === 'object' &&
		Object.keys(date).every((stage) => dateStages.includes(stage)) &&
		Object.values(date as Record<string, unknown>).every(
			(value) => typeof value === 'string' && value.trim().length > 0
		);

	return (
		typeof plan.refNum === 'string' &&
		typeof plan.leadLPA === 'string' &&
		typeof plan.linkedLPA === 'string' &&
		typeof plan.title === 'string' &&
		validStage(plan.stage) &&
		validStatus(plan.status) &&
		validDates(plan.dates) &&
		validSections(plan.sections) &&
		Array.isArray(plan.documents) &&
		plan.documents.length > 0 &&
		plan.documents.every(validApplicationDoc)
	);
}

//mock data factories

export const mockApplicationDoc = (overrides: Partial<ApplicationDoc> = {}): ApplicationDoc => ({
	title: 0, //title of document, mapped, valid between 0->14, (3/6/2026)
	type: 0, // which type (Procedural documents,Consultation documents,Submit) doc is, mapped, valid 0->2, (3/6/2026)
	file: null, // will be for file when implemented
	state: 0, // which state (Not started,In progress,Completed on) document is, mapped, valid 0->2, (3/6/2026)
	dateCompleted: null, //when completed
	...overrides
});

export const mockPlan = (overrides: Partial<Plan> = {}): Plan => ({
	refNum: 'PLAN/001', //Reference Number
	leadLPA: 'Southampton City Council', //Lead Local Planning Authority
	linkedLPA: 'Romsey Town Council', //Linked Local Planning Authority
	title: 'East Borough Local Plan', //Plan Title
	stage: 1, //Current Stage (G1, G2, G3, E), mapped, valid 0->3, (3/6/2026)
	status: 0, //Status of current stage (used for tags), mapped, valid 0->5, (3/6/2026)
	dates: { G1: '7 May 2026', G2: '21 July 2026', G3: '1 August 2026', E: '1 September 2026' }, //dates of gateways as obj  e.g. "G1: 7 May 2026, G2: 21 July 2026, G3: 1 August 2026, E: 1 September 2026"
	sections: [0, 0, 0], // track which state each gateway is array of state e.g. [0,0,0]
	documents: buildBlankApplicationDocs(), // holds interfaces of each doc needed
	...overrides
});

export function buildBlankApplicationDocs(): ApplicationDoc[] {
	const applicationDocTypes = [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2]; //set 9/6/2026
	const testApplicationDocs = [];
	for (const titles of validDocTitles) {
		// currently 14 possible doc
		testApplicationDocs.push(
			mockApplicationDoc({
				title: titles,
				type: applicationDocTypes[titles] as DocType
			})
		);
	}
	return testApplicationDocs;
}

export function buildApplicationDocs(applicationDocs: unknown[]): ApplicationDoc[] {
	const applicationDocTypes = [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2]; //set 9/6/2026

	let testApplicationDocs = [];

	if (applicationDocs.length > 0) {
		for (const titles of validDocTitles) {
			// currently 14 possible doc
			const doc = applicationDocs.find(
				(doc): doc is ApplicationDoc => validApplicationDoc(doc) && doc.title === titles
			);
			if (doc) {
				testApplicationDocs.push(
					mockApplicationDoc({
						...doc
					})
				);
			} else {
				testApplicationDocs.push(
					mockApplicationDoc({
						title: titles,
						type: applicationDocTypes[titles] as DocType
					})
				);
			}
		}
	} else {
		testApplicationDocs = buildBlankApplicationDocs();
	}
	return testApplicationDocs;
}

function transformDates(dates: unknown): { G1: string; G2: string; G3: string; E: string } {
	// Handle pipe-separated string format from backend: "7 May 2026|21 July 2026|August 2026|September 2026"
	if (typeof dates === 'string') {
		const parts = dates.split('|');
		return {
			G1: parts[0] || '',
			G2: parts[1] || '',
			G3: parts[2] || '',
			E: parts[3] || ''
		};
	}

	// Handle object format: { G1: '7 May 2026', G2: '21 July 2026', ... }
	if (dates !== null && typeof dates === 'object') {
		const dateObj = dates as Record<string, unknown>;
		return {
			G1: typeof dateObj.G1 === 'string' ? dateObj.G1 : '',
			G2: typeof dateObj.G2 === 'string' ? dateObj.G2 : '',
			G3: typeof dateObj.G3 === 'string' ? dateObj.G3 : '',
			E: typeof dateObj.E === 'string' ? dateObj.E : ''
		};
	}

	// Fallback to empty dates
	return { G1: '', G2: '', G3: '', E: '' };
}

export function buildPlan(plan: unknown): unknown {
	if (plan !== null && typeof plan === 'object') {
		const docs = 'documents' in plan && Array.isArray(plan.documents) ? plan.documents : [];
		const dates = 'dates' in plan ? transformDates(plan.dates) : { G1: '', G2: '', G3: '', E: '' };
		return mockPlan({
			...plan,
			dates,
			documents: buildApplicationDocs(docs)
		});
	}
}

export function buildPlans(plans: unknown[]): unknown[] {
	const testPlans = [];
	for (const plan of plans) {
		if (plan !== null && typeof plan === 'object') {
			testPlans.push(buildPlan(plan));
		}
	}
	return testPlans;
}

export function buildTestPlans(): unknown[] {
	// unknown so validation still runs

	const testData: unknown[] = [
		{
			refNum: 'PLAN/001',
			leadLPA: 'Southampton City Council',
			linkedLPA: 'Romsey Town Council',
			title: 'East Borough Local Plan',
			dates: { G1: '7 May 2026', G2: '21 July 2026', G3: '1 August 2026', E: '1 September 2026' }
		},
		{
			refNum: 'PLAN/002',
			leadLPA: 'Southampton City Council',
			linkedLPA: 'Romsey Town Council',
			title: 'West Local Plan',
			status: 1,
			dates: { G1: '7 May 2026', G2: '21 July 2026', G3: '1 August 2026', E: '1 September 2026' }
		},
		{
			refNum: 'PLAN/003',
			leadLPA: 'Southampton City Council',
			linkedLPA: 'Romsey Town Council',
			title: 'Southside Local Plan',
			stage: 2,
			status: 2,
			dates: { G1: '7 May 2026', G2: '21 July 2026', G3: '1 August 2026', E: '1 September 2026' }
		},
		{
			refNum: 'PLAN/004',
			leadLPA: 'Southampton City Council',
			linkedLPA: 'Romsey Town Council',
			title: 'North District Local Plan',
			stage: 3,
			status: 3,
			dates: { G1: '7 May 2026', G2: '21 July 2026', G3: '1 August 2026', E: '1 September 2026' }
		},
		{
			refNum: 'PLAN/005',
			leadLPA: 'Southampton City Council',
			linkedLPA: 'Romsey Town Council',
			title: 'Seaside Local Plan',
			stage: 3,
			status: 4,
			dates: { G1: '7 May 2026', G2: '21 July 2026', G3: '1 August 2026', E: '1 September 2026' }
		},
		{
			refNum: 'PLAN/006',
			leadLPA: 'Southampton City Council',
			linkedLPA: 'Romsey Town Council',
			title: 'Central City Local Plan',
			stage: 3,
			status: 5,
			dates: { G1: '7 May 2026', G2: '21 July 2026', G3: '1 August 2026', E: '1 September 2026' }
		},
		{
			refNum: 'PLAN/007',
			leadLPA: '',
			linkedLPA: '',
			title: 'Error Plan',
			stage: 999,
			status: 999,
			dates: {},
			documents: []
		}
	];
	return buildPlans(testData);
}

export const testPlan: unknown[] = [
	{
		refNum: 'PLAN/001',
		leadLPA: 'Southampton',
		linkedLPA: 'Romsey Town Council',
		title: 'East plan',
		stage: 1,
		status: 0,
		dates: { G1: '7 May 2026', G2: '21 July 2026', G3: '1 August 2026', E: '1 September 2026' },
		sections: [0, 0, 0],
		documents: [
			{ title: 0, type: 0, file: null, state: 0, dateCompleted: null },
			{ title: 1, type: 0, file: null, state: 0, dateCompleted: null },
			{ title: 2, type: 0, file: null, state: 0, dateCompleted: null },
			{ title: 3, type: 0, file: null, state: 0, dateCompleted: null },
			{ title: 4, type: 0, file: null, state: 0, dateCompleted: null },
			{ title: 5, type: 0, file: null, state: 0, dateCompleted: null },
			{ title: 6, type: 0, file: null, state: 0, dateCompleted: null },
			{ title: 7, type: 0, file: null, state: 0, dateCompleted: null },
			{ title: 8, type: 0, file: null, state: 0, dateCompleted: null },
			{ title: 9, type: 0, file: null, state: 0, dateCompleted: null },
			{ title: 10, type: 0, file: null, state: 0, dateCompleted: null },
			{ title: 11, type: 0, file: null, state: 0, dateCompleted: null },
			{ title: 12, type: 0, file: null, state: 0, dateCompleted: null },
			{ title: 13, type: 0, file: null, state: 0, dateCompleted: null },
			{ title: 14, type: 0, file: null, state: 0, dateCompleted: null }
		]
	}
];
