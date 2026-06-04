import { BasePage } from '../../base-page.ts';

export class PlanTypePage extends BasePage {
	constructor() {
		super('/create-a-case/case-details/plan-type');
	}

	planTypeOption(value: string) {
		return cy.getByData(`answer-${value}`);
	}

	verifyLoaded() {
		this.verifyPath();
		this.verifyHeading('What is the plan type?');
		this.planTypeOption('local-plan').should('exist');
		this.planTypeOption('other').should('exist');
		this.verifyMainContains('Local Plan', 'Other');
		this.verifySaveAndContinueVisible();
	}

	selectPlanType(value: string) {
		this.planTypeOption(value).should('exist').check();
		this.saveAndContinue();
	}
}

export const planTypePage = new PlanTypePage();
