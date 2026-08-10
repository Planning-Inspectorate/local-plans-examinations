import { SmartLookupPage } from '../base/index.ts';

export class CaseOverviewExaminingInspector1Page extends SmartLookupPage {
	constructor() {
		super(
			/^\/case\/.+\/overview\/contacts\/examining-inspector-1$/,
			'examiningInspector1',
			'Which Inspector is assigned for Examination?'
		);
	}

	enterInspectorName(inspectorName: string) {
		this.enterLookupAnswer(inspectorName);
	}
}
export const caseOverviewExaminingInspector1Page = new CaseOverviewExaminingInspector1Page();
