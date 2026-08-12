import { SmartLookupPage } from '../base/index.ts';

const contactQuestionPath = (path: string) => new RegExp(`^/case/.+/overview/contacts/${path}$`);

export const caseOverviewGateway2AssessorPage = new SmartLookupPage(
	contactQuestionPath('assessor-gateway-2'),
	'assessorName',
	'Who is the Gateway 2 assessor?'
);

export const caseOverviewGateway3AssessorPage = new SmartLookupPage(
	contactQuestionPath('assessor-gateway-3'),
	'assessorGateway3',
	'Who is the Gateway 3 assessor?'
);

export const caseOverviewExaminingInspector1Page = new SmartLookupPage(
	contactQuestionPath('examining-inspector-1'),
	'examiningInspector1',
	'Which Inspector is assigned for Examination?'
);

export const caseOverviewExaminingInspector2Page = new SmartLookupPage(
	contactQuestionPath('examining-inspector-2'),
	'examiningInspector2',
	'Which Inspector is assigned for Examination?'
);

export const caseOverviewExaminingInspector3Page = new SmartLookupPage(
	contactQuestionPath('examining-inspector-3'),
	'examiningInspector3',
	'Which Inspector is assigned for Examination?'
);

export const caseOverviewQAInspector1Page = new SmartLookupPage(
	contactQuestionPath('qa-inspector-1'),
	'qaInspector1',
	'Which Inspector is assigned for QA?'
);

export const caseOverviewQAInspector2Page = new SmartLookupPage(
	contactQuestionPath('qa-inspector-2'),
	'qaInspector2',
	'Which Inspector is assigned for QA?'
);

export const caseOverviewQAInspector3Page = new SmartLookupPage(
	contactQuestionPath('qa-inspector-3'),
	'qaInspector3',
	'Which Inspector is assigned for QA?'
);
