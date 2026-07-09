import { PlanTypeBasePage } from '../base/index.ts';

export class PlanTypePage extends PlanTypeBasePage {
	constructor() {
		super('/create-a-case/case-details/plan-type');
	}
}

export const planTypePage = new PlanTypePage();
