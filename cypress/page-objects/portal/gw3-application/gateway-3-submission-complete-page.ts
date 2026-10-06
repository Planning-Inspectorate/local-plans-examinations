import { PortalPlanBasePage } from '../base/portal-plan-page.ts';

export class Gateway3SubmissionCompletePage extends PortalPlanBasePage {
	constructor() {
		super(/^\/manage-local-plans\/[^/]+\/gateway-3-submission\/submission-complete$/);
	}

	pathFor(planReference: string) {
		return `/manage-local-plans/${planReference}/gateway-3-submission/submission-complete`;
	}

	verifyLoaded() {
		super.verifyLoaded();
		this.verifyHeading('Gateway 3 submission complete');
		cy.get('h1').should('have.length', 1);
	}

	checkSubmissionStatusLink(planReference: string) {
		return cy.get(`a[href="/manage-local-plans/${planReference}"]`);
	}

	get getInTouchLink() {
		return cy.getByData('get-in-touch');
	}

	verifyGetInTouchLink() {
		this.getInTouchLink
			.should('be.visible')
			.and('contain.text', 'get in touch')
			.and('have.attr', 'class', 'govuk-link');
	}
}

export const gateway3SubmissionCompletePage = new Gateway3SubmissionCompletePage();
