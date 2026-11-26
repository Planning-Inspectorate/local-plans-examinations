import { PortalPlanBasePage } from '../base/portal-plan-page.ts';

export class Gateway3ResubmissionSubmissionCompletePage extends PortalPlanBasePage {
	constructor() {
		super(/^\/manage-local-plans\/[^/]+\/gateway-3-resubmission\/submission-complete$/);
	}

	pathFor(planReference: string) {
		return `/manage-local-plans/${planReference}/gateway-3-resubmission/submission-complete`;
	}

	verifyLoaded() {
		super.verifyLoaded();
		this.verifyHeading('Gateway 3 submission complete');
		cy.get('h1').should('have.length', 1);
	}

	checkSubmissionStatusLink(planReference: string) {
		return cy.get(`a[href="/manage-local-plans/${planReference}"]`);
	}
}

export const gateway3ResubmissionSubmissionCompletePage = new Gateway3ResubmissionSubmissionCompletePage();
