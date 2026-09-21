import { BasePage } from '../../base-page.ts';

export class Gateway3DecisionPage extends BasePage {
	constructor() {
		super(/^\/case\/.+\/gateway-3\/gateway-3-submission-(\d+)\/gateway-3-decision-(\d+)$/);
	}

	decisionRadio(value: string) {
		return cy.getByData(`answer-${value}`);
	}

	verifyDecisionForm() {
		this.verifyHeading('What is the outcome of your Gateway 3 decision');
		this.decisionRadio('1').parent().should('contain.text', 'Proceed to examination');
		this.decisionRadio('2').parent().should('contain.text', 'Resubmission required');
		this.verifySaveAndContinueVisible();
	}

	verifyLoaded() {
		super.verifyLoaded();
		this.verifyDecisionForm();
	}

	verifyDecisionSelected(value: string) {
		this.decisionRadio(value).should('have.attr', 'checked');
	}

	selectDecision(value: string) {
		this.decisionRadio(value).should('exist').check();
		this.saveAndContinue();
	}
}
export const gateway3DecisionPage = new Gateway3DecisionPage();
