import { PortalPlanBasePage } from '../base/portal-plan-page.ts';

export class ApplicationCompletePage extends PortalPlanBasePage {
	constructor() {
		super(/^\/manage-local-plans\/[^/]+\/gateway-2\/confirmation$/);
	}

	pathFor(planReference: string) {
		return `/manage-local-plans/${planReference}/gateway-2/confirmation`;
	}

	verifyLoaded() {
		super.verifyLoaded();
		this.verifyHeading('Gateway 2 submission complete');
		cy.get('h1').should('have.length', 1);
	}

	returnToYourPlanLink(planReference: string) {
		return cy.get(`a[data-cy="check-submission-status"][href="/manage-local-plans/${planReference}"]`);
	}
	verifyReturnToYourPlanLink(planReference: string) {
		this.returnToYourPlanLink(planReference).should('be.visible').and('contain.text', 'check your submission status');
	}
}

export const applicationCompletePage = new ApplicationCompletePage();
