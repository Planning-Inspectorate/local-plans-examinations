import { PortalPlanBasePage } from '../base/portal-plan-page.ts';

export class Gateway3ApplicationCompletePage extends PortalPlanBasePage {
	constructor() {
		super(/^\/manage-local-plans\/[^/]+\/gateway-3-submission\/submission-complete$/);
	}

	pathFor(planReference: string) {
		return `/manage-local-plans/${planReference}/gateway-3-submission/submission-complete`;
	}

	verifyLoaded() {
		super.verifyLoaded();
		this.verifyHeading('Submission complete');
		cy.get('h1').should('have.length', 1);
	}

	returnToYourPlanLink(planReference: string) {
		return cy.get(`a[href="/manage-local-plans/${planReference}"]`);
	}
}

export const gateway3ApplicationCompletePage = new Gateway3ApplicationCompletePage();
