import { BasePage } from '../../base-page.ts';

export class PlanTypeBasePage extends BasePage {
	planTypeOption(value: string) {
		return cy.getByData(`answer-${value}`);
	}

	verifyPlanTypeForm() {
		this.verifyHeading('What is the plan type?');
		this.planTypeOption('local-plan').should('exist');
		this.planTypeOption('other').should('exist');
		this.verifyMainContains('Local Plan', 'Other');
		this.verifySaveAndContinueVisible();
	}

	verifyLoaded() {
		this.verifyPath();
		this.verifyPlanTypeForm();
	}

	selectPlanType(value: string) {
		this.planTypeOption(value).should('exist').check();
		this.saveAndContinue();
	}
}
