import { BasePage } from '../../base-page.ts';

export class ApplicationCompletePage extends BasePage {
	constructor() {
		super(/^\/manage-local-plans\/[^/]+\/gateway-2-application\/application-complete$/);
	}

	returnToYourPlanLink(planReference: string) {
		return cy.get(`a[href="/manage-local-plans/${planReference}"]`);
	}

	visit(planReference: string) {
		cy.visit(this.pathFor(planReference));
	}

	pathFor(planReference: string) {
		return `/manage-local-plans/${planReference}/gateway-2-application/application-complete`;
	}

	verifyPathForPlan(planReference: string) {
		this.verifyPath(this.pathFor(planReference));
	}
}

export const applicationCompletePage = new ApplicationCompletePage();
