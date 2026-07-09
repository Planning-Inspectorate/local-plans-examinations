import { PlanTypeBasePage } from '../base/index.ts';

export class CaseOverviewPlanTypePage extends PlanTypeBasePage {
	constructor() {
		super(/^\/case\/.+\/overview\/case-details\/plan-type$/);
	}
}

export const caseOverviewPlanTypePage = new CaseOverviewPlanTypePage();
