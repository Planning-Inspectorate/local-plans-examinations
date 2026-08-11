import { SmartLookupPage } from '../base/index.ts';

export class CaseOverviewQAInspector2Page extends SmartLookupPage {
	constructor() {
		super(/^\/case\/.+\/overview\/contacts\/qa-inspector-2$/, 'qaInspector2', 'Which Inspector is assigned for QA?');
	}
}

export const caseOverviewQAInspector2Page = new CaseOverviewQAInspector2Page();
