import { PlanTitleBasePage } from '../base/index.ts';

export class CaseOverviewPlanTitlePage extends PlanTitleBasePage {
	constructor() {
		super(/^\/case\/.+\/overview\/case-details\/plan-title$/);
	}
}

export const caseOverviewPlanTitlePage = new CaseOverviewPlanTitlePage();
