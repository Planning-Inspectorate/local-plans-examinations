import { GatewayBasePage } from '../base/gateway-page.ts';

export class Gateway2AssessorPage extends GatewayBasePage {
	constructor() {
		super(/^\/case\/.+\/gateway-2\/gateway-2\/gateway-2-assessor$/);
	}

	get assessorNameField() {
		return cy.get('input[id="assessorName"]');
	}

	assessorNameItem(AssessorName: string) {
		return cy.get(`[role="option"]`).contains(AssessorName).should('be.visible');
	}

	selectAssessorName(AssessorName: string) {
		this.assessorNameField.type(AssessorName);
		this.assessorNameItem(AssessorName).click();
		this.saveAndContinue();
	}

	assessorSelected(AssessorName: string) {
		return this.assessorNameField.should('have.value', AssessorName);
	}

	verifyLoaded(planTitle: string) {
		super.verifyLoaded(planTitle);
		super.verifySaveAndContinueVisible();
	}
}
export const gateway2AssessorPage = new Gateway2AssessorPage();
