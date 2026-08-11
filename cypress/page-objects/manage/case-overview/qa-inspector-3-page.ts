import { SmartLookupPage } from '../base/index.ts';

export class CaseOverviewQAInspector3Page extends SmartLookupPage {
	constructor() {
		super(/^\/case\/.+\/overview\/contacts\/qa-inspector-3$/, 'qaInspector3', 'Which Inspector is assigned for QA?');
	}
}

export const caseOverviewQAInspector3Page = new CaseOverviewQAInspector3Page();
