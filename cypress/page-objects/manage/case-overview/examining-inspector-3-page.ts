import { SmartLookupPage } from '../base/index.ts';

export class CaseOverviewExaminingInspector3Page extends SmartLookupPage {
	constructor() {
		super(
			/^\/case\/.+\/overview\/contacts\/examining-inspector-3$/,
			'examiningInspector3',
			'Which Inspector is assigned for Examination?'
		);
	}
}
export const caseOverviewExaminingInspector3Page = new CaseOverviewExaminingInspector3Page();
