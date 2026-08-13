import { BasePage } from '../../base-page.ts';

export class DeleteCasePage extends BasePage {
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
	}

	verifyFixtureCaseData(...values: string[]) {
		this.verifyCaseReference();
		this.table.within(() => {
			values.forEach((value) => {
				cy.get('.govuk-table__row').should('contain.text', value);
			});
		});
	}

	verifyCaseReference() {
		this.table.within(() => {
			cy.get('.govuk-table__row')
				.first()
				.should('be.visible')
				.invoke('text')
				.should('match', /PLAN\/\d/);
		});
	}

	deleteCase() {
		this.deleteCaseButton.click();
	}
}

export const deleteCasePage = new DeleteCasePage();
