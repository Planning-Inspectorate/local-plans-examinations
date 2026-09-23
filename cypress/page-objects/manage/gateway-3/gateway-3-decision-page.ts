import { BasePage } from '../../base-page.ts';

export type GW3Decision = 'Proceed' | 'Resubmit';

export class Gateway3DecisionPage extends BasePage {
	constructor() {
		super(/^\/case\/.+\/gateway-3\/gateway-3-submission-(\d+)\/gateway-3-decision-(\d+)$/);
	}

	private decisionMap: Record<GW3Decision, number> = {
		Proceed: 1,
		Resubmit: 2
	};

	decisionRadio(decision: GW3Decision) {
		return cy.getByData(`answer-${this.decisionMap[decision]}`);
	}

	verifyDecisionForm() {
		this.verifyHeading('What is the outcome of your Gateway 3 decision');
		this.decisionRadio('Proceed').parent().should('contain.text', 'Proceed to examination');
		this.decisionRadio('Resubmit').parent().should('contain.text', 'Resubmission required');
		this.verifySaveAndContinueVisible();
	}

	verifyLoaded() {
		super.verifyLoaded();
		this.verifyDecisionForm();
	}

	verifyDecisionSelected(decision: GW3Decision) {
		this.decisionRadio(decision).should('have.attr', 'checked');
	}

	selectDecision(decision: GW3Decision) {
		this.decisionRadio(decision).should('exist').check();
		this.saveAndContinue();
	}
}
export const gateway3DecisionPage = new Gateway3DecisionPage();
