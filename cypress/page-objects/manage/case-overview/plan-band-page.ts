import { BasePage } from '../../base-page.ts';

export class CaseOverviewPlanBandPage extends BasePage {
	constructor() {
		super(/^\/case\/.+\/overview\/case-details\/plan-band$/);
	}

	verifyLoaded() {
		this.verifyPath();
		this.verifyHeading('What is the plan band?');
	}
}

export const caseOverviewPlanBandPage = new CaseOverviewPlanBandPage();
