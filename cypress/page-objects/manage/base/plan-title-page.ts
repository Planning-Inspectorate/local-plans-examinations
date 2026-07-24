import { BasePage } from '../../base-page.ts';

export class PlanTitleBasePage extends BasePage {
	get planTitleInput() {
		return cy.get('[data-cy="plan-title-input"], input[name="planTitle"]');
	}

	verifyPlanTitleForm(value?: string) {
		this.verifyHeading('What is the plan title?');
		this.planTitleInput.should('be.visible');

		if (value) {
			this.planTitleInput.should('have.value', value);
		}

		this.verifySaveAndContinueVisible();
	}

	verifyTitleFilled(value: string) {
		this.planTitleInput.should('have.value', value);
	}

	verifyLoaded(value?: string) {
		super.verifyLoaded();
		this.verifyPlanTitleForm(value);
	}

	enterPlanTitle(value: string) {
		this.planTitleInput.clearAndWrite(value);
		this.saveAndContinue();
	}
}
