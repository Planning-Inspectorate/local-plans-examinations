import { PortalPlanBasePage } from '../base/portal-plan-page.ts';

export class ExaminationSubmissionCompletePage extends PortalPlanBasePage {
	constructor() {
		super(/^\/manage-local-plans\/[^/]+\/examination-submission\/submission-complete$/);
	}

	pathFor(planReference: string) {
		return `/manage-local-plans/${planReference}/examination-submission/submission-complete`;
	}

	get confirmationEmailCopy() {
		return cy.getByData('confirmation-email-copy');
	}

	get whatHappensNextHeading() {
		return cy.getByData('what-happens-next-heading');
	}

	get whatHappensNextList() {
		return cy.getByData('what-happens-next-list');
	}

	get checkSubmissionStatusLink() {
		return cy.getByData('check-submission-status');
	}

	verifyLoaded() {
		super.verifyLoaded();
		this.verifyHeading('Submission complete');
		cy.get('h1').should('have.length', 1);
	}

	verifyPageContent(planReference: string) {
		this.verifyLoaded();
		this.verifyServiceNavigation('Guidance', 'Sign out');
		this.confirmationEmailCopy.should('be.visible').and('have.text', 'We have sent you a confirmation email.');
		this.whatHappensNextHeading.should('be.visible').and('have.text', 'What happens next');
		this.verifyMainContains("We'll appoint one or more inspectors to your case, who will:");
		this.whatHappensNextList
			.find('li')
			.should('have.length', 2)
			.then((items) => {
				expect(items.eq(0)).to.have.text('review your submission documents');
				expect(items.eq(1)).to.have.text('let you know if they need any additional information');
			});
		this.verifyMainContains('At any point you can');
		this.verifyCheckSubmissionStatusLink(planReference);
	}

	verifyCheckSubmissionStatusLink(planReference: string) {
		this.checkSubmissionStatusLink
			.should('be.visible')
			.and('have.text', 'check your submission status')
			.and('have.attr', 'href', `/manage-local-plans/${planReference}`);
	}
}

export const examinationSubmissionCompletePage = new ExaminationSubmissionCompletePage();
