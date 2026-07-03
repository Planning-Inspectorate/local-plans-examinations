import { BasePage } from '../../base-page.ts';

export type SelectAnswer = {
	value: string;
	label?: string;
};

export class SelectLocalPlanningAuthorityBasePage extends BasePage {
	get localPlanningAuthoritySelect() {
		return cy.get('#lpa');
	}

	verifySelectLocalPlanningAuthorityForm() {
		this.verifyHeading('Select the Local Planning Authority for this plan');
		this.localPlanningAuthoritySelect.should('be.visible');
		this.verifySaveAndContinueVisible();
	}

	verifyLoaded() {
		this.verifyPath();
		this.verifySelectLocalPlanningAuthorityForm();
	}

	selectLocalPlanningAuthority(lpa: SelectAnswer) {
		this.localPlanningAuthoritySelect.should('be.visible').select(lpa.value);
		this.saveAndContinue();
	}
}
