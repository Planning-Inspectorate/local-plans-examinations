import { SmartLookupPage } from '../base/index.ts';

export class CaseOverviewExaminingInspector2Page extends SmartLookupPage {
	constructor() {
		super(
			/^\/case\/.+\/overview\/contacts\/examining-inspector-2$/,
			'examiningInspector2',
			'Which Inspector is assigned for Examination?'
		);
	}
}
export const caseOverviewExaminingInspector2Page = new CaseOverviewExaminingInspector2Page();
