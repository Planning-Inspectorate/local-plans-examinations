import { PortalPlanBasePage } from '../base/portal-plan-page.ts';

export class Gateway3ResubmissionPage extends PortalPlanBasePage {
	constructor(path: RegExp = /^\/manage-local-plans\/[^/]+\/gateway-3-resubmission$/) {
		super(path);
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

	get resubmissionTag() {
		return cy.get('.govuk-tag.govuk-tag--red');
	}

	get reportRow() {
		return cy.getByData('submission-report-row');
	}

	get previousSubmissionsRow() {
		return cy.getByData('previous-submissions-row');
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

	verifyResubmissionTag() {
		this.resubmissionTag.should('be.visible').and('contain.text', 'Resubmission required');
	}

	verifyUploadedDocument(fileName: string) {
		this.newDocumentsTable.within(() => {
			cy.contains('.govuk-summary-list__row', 'Documents').within(() => {
				cy.contains('a', fileName).should('be.visible');
				cy.getByData('add-documents').should('contain.text', 'Change');
			});
		});
	}

	clickPreviousSubmission(submissionNumber: number) {
		this.previousSubmissionsRow.contains('a', `Submission ${submissionNumber}`).click();
	}

	verifyReport(submissionNumber: number, fileNames: string[], dateText: string) {
		this.reportRow.should('be.visible').within(() => {
			cy.get('.govuk-summary-list__key').should('contain.text', `Submission ${submissionNumber} report`);
			cy.getByData('download-report').should('have.length', fileNames.length);
			fileNames.forEach((fileName) => cy.contains('a', fileName).should('be.visible'));
		});
		this.reportRow.should('contain.text', dateText);
	}

	verifyPreviousSubmissions(planReference: string, submittedDates: string[]) {
		this.previousSubmissionsRow.should('be.visible').within(() => {
			cy.get('a').should('have.length', submittedDates.length);
			submittedDates.forEach((_, index) => {
				const number = index + 1;
				cy.get('a')
					.eq(index)
					.should('have.text', `Submission ${number}`)
					.and('have.attr', 'href', `/manage-local-plans/${planReference}/gateway-3-resubmission/submission/${number}`);
			});
		});
		submittedDates.forEach((date) => this.previousSubmissionsRow.should('contain.text', `(submitted on ${date})`));
	}

	verifyFileDownloads(container: Cypress.Chainable, fileName: string) {
		container
			.contains('a', fileName)
			.should('be.visible')
			.invoke('attr', 'href')
			.then((href) => {
				cy.request(href as string).then((response) => {
					expect(response.status).to.equal(200);
					expect(response.headers['content-disposition']).to.include(`attachment; filename="${fileName}"`);
				});
			});
	}
}

export const gateway3ResubmissionPage = new Gateway3ResubmissionPage();
