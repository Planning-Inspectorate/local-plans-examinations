import { PortalPlanBasePage } from '../base/portal-plan-page.ts';

const gateway2SubmissionRows = ['Gateway 2 covering letter', 'Local plan timetable', 'Project initiation document'];
const gateway2SubmissionHeading = 'Gateway 2 submission';
const notAddedStatus = 'Not added';
const submitButtonText = 'Submit for Gateway 2 assessment';

export class Gateway2ApplicationPage extends PortalPlanBasePage {
	constructor() {
		super(/^\/manage-local-plans\/[^/]+\/gateway-2-submission$/);
	}

	pathFor(planReference: string) {
		return `/manage-local-plans/${planReference}/gateway-2-submission`;
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
		this.verifyHeading(gateway2SubmissionHeading);
	}

	// Cross-service tests start in Manage, so these Portal assertions need to run inside cy.origin().
	openForCrossServiceAndVerify(planReference: string, planTitle: string) {
		const path = this.pathFor(planReference);

		cy.origin(
			Cypress.env('portalBaseUrl'),
			{
				args: { path, planTitle, gateway2SubmissionRows, gateway2SubmissionHeading, notAddedStatus, submitButtonText }
			},
			({ path, planTitle, gateway2SubmissionRows, gateway2SubmissionHeading, notAddedStatus, submitButtonText }) => {
				cy.visit(path);
				cy.location('pathname').should('eq', path);
				cy.contains('h1', gateway2SubmissionHeading).should('be.visible').and('contain.text', planTitle);

				gateway2SubmissionRows.forEach((row) => {
					cy.contains('tr', row).should('be.visible').and('contain.text', notAddedStatus);
				});

				cy.contains('button', submitButtonText).should('be.visible');
			}
		);
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

	verifyDocumentRowContains(table: Cypress.Chainable, document: string, ...fileNames: string[]) {
		table.within(() => {
			const row = cy.contains('tr', document);
			fileNames.forEach((fileName) => {
				row.should('contain.text', fileName);
			});
		});
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
