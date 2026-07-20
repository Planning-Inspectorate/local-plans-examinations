import { BasePage } from '../../base-page.ts';

export class Gateway2ApplicationPage extends BasePage {
	constructor() {
		super(/^\/manage-local-plans\/[^/]+\/gateway-2-application$/);
	}

	visit(planReference: string) {
		cy.visit(this.pathFor(planReference));
	}

	get saveAndComeBackLink() {
		return cy.getByData('save-and-come-back');
	}

	get submitGateway2AssessmentButton() {
		return cy.getByData('submit-gateway-2');
	}

	get proceduralDocumentsTable() {
		return cy.getByData('procedural-documents-table');
	}

	get consultationDocumentsTable() {
		return cy.getByData('consultation-documents-table');
	}

	get additionalDocumentsTable() {
		return cy.getByData('additional-documents-table');
	}

	get workshopPreferencesTable() {
		return cy.getByData('workshop-preferences-table');
	}

	verifyLoaded() {
		super.verifyLoaded();
		this.verifyHeading('Gateway 2 submission');
	}

	verifySaveAndComeBackLink(href: string) {
		this.saveAndComeBackLink
			.should('be.visible')
			.and('contain.text', 'Save and come back later')
			.and('have.attr', 'href', href);
	}

	verifySubmitGateway2AssessmentButton() {
		this.submitGateway2AssessmentButton
			.should('be.visible')
			.and('contain.text', 'Submit for Gateway 2 assessment')
			.and('have.attr', 'type', 'submit');
	}

	verifyTableHeaders(table: Cypress.Chainable, headers: string[]) {
		table.within(() => {
			headers.forEach((header) => {
				cy.contains('th', header).should('be.visible');
			});
		});
	}

	verifyTableRows(table: Cypress.Chainable, rows: { document: string; status: string; addCy: string }[]) {
		table.within(() => {
			rows.forEach(({ document, status, addCy }) => {
				const row = cy.contains('tr', document);
				row.should('be.visible');
				row.should('contain.text', status);
				cy.getByData(addCy).should('be.visible');
			});
		});
	}

	pathFor(planReference: string) {
		return `/manage-local-plans/${planReference}/gateway-2-application`;
	}

	verifyPathForPlan(planReference: string) {
		this.verifyPath(this.pathFor(planReference));
	}

	verifyTableRowsInOrder(table: Cypress.Chainable, documents: string[]) {
		table.within(() => {
			cy.get('tbody tr').should('have.length', documents.length);
			documents.forEach((document, index) => {
				cy.get('tbody tr').eq(index).should('contain.text', document);
			});
		});
	}
}

export const gateway2ApplicationPage = new Gateway2ApplicationPage();
