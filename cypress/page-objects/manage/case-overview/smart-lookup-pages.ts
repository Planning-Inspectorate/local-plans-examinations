import { SmartLookupPage } from '../base/index.ts';
import {
	assessorGateway2,
	assessorGateway3,
	examiningInspector1,
	examiningInspector2,
	examiningInspector3,
	qaInspector1,
	qaInspector2,
	qaInspector3
} from '../../../fixtures/manage/overview.ts';

const contactQuestionPath = (path: string) => new RegExp(`^/case/.+/overview/contacts/${path}$`);

export const caseOverviewGateway2AssessorPage = new SmartLookupPage(
	contactQuestionPath(assessorGateway2.path),
	assessorGateway2.field,
	assessorGateway2.heading
);

export const caseOverviewGateway3AssessorPage = new SmartLookupPage(
	contactQuestionPath(assessorGateway3.path),
	assessorGateway3.field,
	assessorGateway3.heading
);

export const caseOverviewExaminingInspector1Page = new SmartLookupPage(
	contactQuestionPath(examiningInspector1.path),
	examiningInspector1.field,
	examiningInspector1.heading
);

export const caseOverviewExaminingInspector2Page = new SmartLookupPage(
	contactQuestionPath(examiningInspector2.path),
	examiningInspector2.field,
	examiningInspector2.heading
);

export const caseOverviewExaminingInspector3Page = new SmartLookupPage(
	contactQuestionPath(examiningInspector3.path),
	examiningInspector3.field,
	examiningInspector3.heading
);

export const caseOverviewQAInspector1Page = new SmartLookupPage(
	contactQuestionPath(qaInspector1.path),
	qaInspector1.field,
	qaInspector1.heading
);

export const caseOverviewQAInspector2Page = new SmartLookupPage(
	contactQuestionPath(qaInspector2.path),
	qaInspector2.field,
	qaInspector2.heading
);

export const caseOverviewQAInspector3Page = new SmartLookupPage(
	contactQuestionPath(qaInspector3.path),
	qaInspector3.field,
	qaInspector3.heading
);
