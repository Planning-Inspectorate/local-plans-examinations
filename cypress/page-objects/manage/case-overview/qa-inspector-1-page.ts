import { SmartLookupPage } from '../base/index.ts';

export class CaseOverviewQAInspector1Page extends SmartLookupPage {
	constructor() {
		super(/^\/case\/.+\/overview\/contacts\/qa-inspector-1$/, 'qaInspector1', 'Which Inspector is assigned for QA?');
	}

	enterQAInspectorName(inspectorName: string) {
		this.enterLookupAnswer(inspectorName);
	}
}

export const caseOverviewQAInspector1Page = new CaseOverviewQAInspector1Page();
