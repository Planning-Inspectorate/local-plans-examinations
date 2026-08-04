import { BasePage } from '../../base-page.ts';

export class Gateway2AssessorPage extends BasePage {
	constructor() {
		super(/^\/case\/.+\/gateway-2\/gateway-2\/gateway-2-assessor$/);
	}

	assessorNameField() {
		return cy.get('input[id="assessorName"]');
	}

	assessorNameItem(AssessorID: string) {
		return cy.get(`[role="option"]`).contains(AssessorID).should('be.visible');
	}

	selectAssessorName(AssessorID: string) {
		this.assessorNameField().type(AssessorID);
		this.assessorNameItem(AssessorID).click();
		this.saveAndContinue();
	}

	assessorItemVisible(AssessorID: string) {
		return cy.get(`[role="option"]`).contains(AssessorID).should('exist');
	}

	verifyLoaded(value?: string) {
		super.verifyLoaded();
		this.verifyHeading('Who is the Gateway 2 assessor?');
		//check autocorrect somehow
		this.verifySaveAndContinueVisible();

		if (value) {
			this.assessorItemVisible(value).should('exist');
		}
	}
}
export const gateway2AssessorPage = new Gateway2AssessorPage();
