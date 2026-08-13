import { BasePage } from '../../base-page.ts';

export class DeletCasePage extends BasePage {
	constructor() {
		super(/^\/case\/.+\/delete-case$/);
	}

	get deleteCaseButton() {
		return cy.getByData('confirm-delete-button');
	}

	get table() {
		return cy.getByData('delete-case-details');
	}

	verifyLoaded() {
		super.verifyLoaded();
		this.verifyHeading('Are you sure you want to delete this case?');
		this.verifyMainContains(
			'This will mark the case as deleted. It will no longer appear in the system but will still be available for audit purposes.',
			'Case details'
		);
		this.verifyFixtureCaseData();
	}

	verifyFixtureCaseData() {
		this.table.within(() => {
			cy.get('.govuk-table__row').should('contain.text', 'Cypress Test Plan');
			cy.get('.govuk-table__row').should('contain.text', 'local-plan');
			cy.get('.govuk-table__row').should('contain.text', 'lpa-1', 'lpa-2');
			cy.get('.govuk-table__row').should('contain.text', 'officer-1');
		});
	}

	deleteCase() {
		this.deleteCaseButton.click();
	}
}

export const deletCasePage = new DeletCasePage();
