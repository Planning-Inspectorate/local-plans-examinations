import { BasePage } from '../../../base-page.ts';

class CancelWorkshopPage extends BasePage {
	constructor() {
		super(/^\/case\/.+\/gateway-2\/set-up-workshop\/delete-\d+$/);
	}

	get cancelButton() {
		return cy.getByData('confirm-cancel-workshop');
	}

	get doNotCancelLink() {
		return cy.getByData('do-not-cancel-workshop');
	}

	verifyLoaded() {
		super.verifyLoaded();
		this.verifyHeading('Are you sure you want to cancel the workshop?');
		this.cancelButton.should('be.visible');
	}

	verifyContent() {
		this.verifyLoaded();
		this.verifyMainContains('This will remove all workshop details including date, time, venue, and estimates.');
		this.cancelButton.should('have.text', 'Cancel workshop').and('have.class', 'govuk-button--warning');
		this.doNotCancelLink
			.should('be.visible')
			.and('have.text', 'Do not cancel')
			.and('have.attr', 'href')
			.and('match', /^\/case\/.+\/gateway-2$/);
	}

	confirmCancellation() {
		this.verifyLoaded();
		this.cancelButton.click();
	}

	keepWorkshop() {
		this.verifyLoaded();
		this.doNotCancelLink.should('be.visible').click();
	}
}

export const cancelWorkshopPage = new CancelWorkshopPage();
