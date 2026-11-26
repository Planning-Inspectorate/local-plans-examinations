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

	verifyPageContent(planReference: string) {
		this.verifyLoaded();
		this.verifyServiceNavigation('Guidance', 'Sign out');
		cy.getByData('confirmation-email-copy')
			.should('be.visible')
			.and('have.text', "We've sent you a confirmation email.");
		cy.getByData('what-happens-next-heading').should('be.visible').and('have.text', 'What happens next');
		cy.getByData('what-happens-next-list')
			.find('li')
			.should('have.length', 3)
			.then((items) => {
				expect(items.eq(0)).to.have.text(
					'The Planning Inspectorate will check that your submission is complete and your plan is ready for the next round of assessment'
				);
				expect(items.eq(1)).to.have.text('They will contact you if any further information is required');
				expect(items.eq(2)).to.have.text('At any point you can check your submission status');
			});
		this.checkSubmissionStatusLink(planReference).should('be.visible').and('have.text', 'check your submission status');
		cy.getByData('get-in-touch-copy').should('not.exist');
	}
}

export const gateway3SubmissionCompletePage = new Gateway3SubmissionCompletePage();
