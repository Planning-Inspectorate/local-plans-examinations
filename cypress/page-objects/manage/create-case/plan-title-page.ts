import { PlanTitleBasePage } from '../base/index.ts';

export class PlanTitlePage extends PlanTitleBasePage {
	constructor() {
		super('/create-a-case/case-details/plan-title');
	}
}

export const planTitlePage = new PlanTitlePage();
