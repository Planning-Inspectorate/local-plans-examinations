import { BasePage } from '../../base-page.ts';

export class PlanTitlePage extends BasePage {
	constructor() {
		super('/create-a-case/case-details/plan-title');
	}

	get planTitleInput() {
		return cy.getByData('plan-title-input');
	}

	verifyLoaded() {
		this.verifyPath();
		this.verifyHeading('What is the plan title?');
		this.planTitleInput.should('be.visible');
		this.verifySaveAndContinueVisible();
	}

	enterPlanTitle(title: string) {
		this.planTitleInput.clearAndWrite(title);
		this.saveAndContinue();
	}
}

export const planTitlePage = new PlanTitlePage();
