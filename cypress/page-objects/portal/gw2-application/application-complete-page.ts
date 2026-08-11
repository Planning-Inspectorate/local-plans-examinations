import { PortalPlanBasePage } from '../base/portal-plan-page.ts';

export class ApplicationCompletePage extends PortalPlanBasePage {
	constructor() {
		super(/^\/manage-local-plans\/[^/]+\/gateway-2-application\/application-complete$/);
	}

	pathFor(planReference: string) {
		return `/manage-local-plans/${planReference}/gateway-2-application/application-complete`;
	}

	verifyLoaded() {
		super.verifyLoaded();
		this.verifyHeading('Application complete');
		cy.get('h1').should('have.length', 1);
	}

	returnToYourPlanLink(planReference: string) {
		return cy.get(`a[href="/manage-local-plans/${planReference}"]`);
	}
}

export const applicationCompletePage = new ApplicationCompletePage();
