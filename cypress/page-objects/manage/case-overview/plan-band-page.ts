import { BasePage } from '../../base-page.ts';
import { planBand } from '../../../fixtures/manage/overview.ts';
export class CaseOverviewPlanBandPage extends BasePage {
	constructor() {
		super(/^\/case\/.+\/overview\/case-details\/plan-band$/);
	}

	verifyLoaded() {
		super.verifyLoaded();
		this.verifyHeading(planBand.heading);
	}
}

export const caseOverviewPlanBandPage = new CaseOverviewPlanBandPage();
