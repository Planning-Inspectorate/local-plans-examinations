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

	localPlanningAuthorityOption(lpa: SelectAnswer) {
		return this.localPlanningAuthoritySelect.find('option').contains(lpa.value);
	}

	verifyLocalPlanningAuthorityOptionDisabled(lpa: SelectAnswer) {
		this.localPlanningAuthorityOption(lpa).should('be.disabled');
	}

	verifyLocalPlanningAuthorityOptionEnabled(lpa: SelectAnswer) {
		this.localPlanningAuthorityOption(lpa).should('not.be.disabled');
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
