import { PortalPlanBasePage } from '../base/portal-plan-page.ts';

export class Gateway3ResubmissionPage extends PortalPlanBasePage {
	constructor() {
		super(/^\/manage-local-plans\/[^/]+\/gateway-3-resubmission$/);
	}

	get previousSubmissionTable() {
		return cy.getByData('previous-submissions-table');
	}

	get newDocumentsTable() {
		return cy.getByData('new-documents-table');
	}

	get saveAndComeBackLink() {
		return cy.getByData('save-and-come-back');
	}

	get submitButton() {
		return cy.getByData('submit-resubmission');
	}

	pathFor(planReference: string) {
		return `/manage-local-plans/${planReference}/gateway-3-resubmission`;
	}

	verifyLoaded(submissionNumber?: string) {
		super.verifyLoaded();
		const expectedHeading = submissionNumber ? `Gateway 3 submission ${submissionNumber}` : 'Gateway 3 submission';

		this.verifyHeading(expectedHeading);
	}

	verifySaveAndComeBackLink(href: string) {
		this.saveAndComeBackLink
			.should('be.visible')
			.and('contain.text', 'Save and come back later')
			.and('have.attr', 'href', href);
	}

	verifyResubmissionData(table: Cypress.Chainable, rows: string[][]) {
		table.within(() => {
			rows.forEach(([key, ...values]) => {
				const row = cy.contains('.govuk-summary-list__row', key);
				row.should('be.visible');
				values.forEach((value) => row.should('contain.text', value));
			});
		});
	}

	verifyDocTableRows(table: Cypress.Chainable, rows: { document: string; status: string; addCy: string }[]) {
		table.within(() => {
			rows.forEach(({ document, status, addCy }) => {
				const row = cy.contains('.govuk-summary-list__row', document);
				row.should('be.visible');
				row.should('contain.text', status);
				cy.getByData(addCy).should('be.visible');
			});
		});
	}

	verifySubmitButton() {
		this.submitButton.should('be.visible').and('contain.text', 'Submit').and('have.attr', 'type', 'submit');
	}
}

export const gateway3ResubmissionPage = new Gateway3ResubmissionPage();
