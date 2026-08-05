import { BasePage } from '../../base-page.ts';

export class Gateway2AssessorPage extends BasePage {
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

	assessorItemVisible(AssessorName: string) {
		return this.assessorNameField.should('have.value', AssessorName);
	}

	verifyLoaded(value?: string) {
		super.verifyLoaded();
		this.verifyHeading('Who is the Gateway 2 assessor?');
		//check autocorrect somehow
		this.verifySaveAndContinueVisible();

		if (value) {
			this.assessorItemVisible(value);
		}
	}
}
export const gateway2AssessorPage = new Gateway2AssessorPage();
