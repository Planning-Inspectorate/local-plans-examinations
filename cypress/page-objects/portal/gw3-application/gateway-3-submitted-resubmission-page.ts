import { Gateway3ResubmissionPage } from './gateway-3-resubmission-page.ts';

export type SubmittedReport = {
	submissionNumber: number;
	fileNames: string[];
	issuedDate: string;
};

export type SubmittedPreviousSubmission = {
	submissionNumber: number;
	submittedDate: string;
};

// Read-only Gateway 3 page shown at /gateway-3-resubmission once a resubmission has been
// sent (Under review) and after the plan has moved to examination (Completed)
export class Gateway3SubmittedResubmissionPage extends Gateway3ResubmissionPage {
	get submissionStatusTag() {
		return cy.getByData('status-tag');
	}

	get reportRows() {
		return cy.getByData('submission-report-row');
	}

	get submissionRows() {
		return cy.getByData('previous-submission-row');
	}

	get currentSubmissionCopy() {
		return cy.getByData('current-submission-copy');
	}

	verifyLoaded(submissionNumber?: string) {
		this.verifyPath();
		this.verifyHeading(submissionNumber ? `Gateway 3, submission ${submissionNumber}` : 'Gateway 3, submission');
	}

	verifySubmissionStatus(label: string) {
		this.submissionStatusTag.should('be.visible').and('have.text', label);
	}

	verifyNoEditingControls() {
		cy.getByData('add-documents').should('not.exist');
		this.submitButton.should('not.exist');
		this.saveAndComeBackLink.should('not.exist');
	}

	verifyReports(reports: SubmittedReport[]) {
		this.reportRows.should('have.length', reports.length);
		reports.forEach(({ submissionNumber, fileNames, issuedDate }, index) => {
			this.reportRows.eq(index).within(() => {
				cy.get('.govuk-summary-list__key').should('have.text', `Submission ${submissionNumber} report`);
				cy.getByData('view-report').should('have.length', fileNames.length);
				if (fileNames.length === 1) {
					cy.getByData('view-report').should('have.text', 'View report');
				} else {
					fileNames.forEach((fileName) => cy.contains('li a', fileName).should('be.visible'));
				}
				cy.get('.govuk-summary-list__value').should('contain.text', `(issued ${issuedDate})`);
			});
		});
	}

	verifySubmissionRows(planReference: string, submissions: SubmittedPreviousSubmission[]) {
		this.submissionRows.should('have.length', submissions.length);
		submissions.forEach(({ submissionNumber, submittedDate }, index) => {
			this.submissionRows.eq(index).within(() => {
				cy.get('.govuk-summary-list__key').should('have.text', `Submission ${submissionNumber}`);
				cy.getByData('view-all-documents')
					.should('contain.text', 'View all documents')
					.and(
						'have.attr',
						'href',
						`/manage-local-plans/${planReference}/gateway-3-resubmission/submission/${submissionNumber}`
					);
				cy.get('.govuk-summary-list__value').should('contain.text', `(submitted ${submittedDate})`);
			});
		});
	}

	verifyCurrentSubmissionCopy(submissionNumber: number, date: string, submitter: string) {
		this.currentSubmissionCopy.should(
			'have.text',
			`Gateway 3, submission ${submissionNumber}: ${date} by ${submitter}`
		);
	}

	verifyNewDocument(fileName: string) {
		this.verifySubHeading('New or updated documents');
		this.newDocumentsTable.within(() => {
			cy.contains('.govuk-summary-list__row', 'Documents').within(() => {
				cy.contains('a', fileName).should('be.visible');
			});
		});
	}

	clickViewAllDocuments(submissionNumber: number) {
		cy.contains('[data-cy="previous-submission-row"]', `Submission ${submissionNumber}`)
			.find('[data-cy="view-all-documents"]')
			.click();
	}

	verifyReportDownload(submissionNumber: number, fileName: string) {
		cy.contains('[data-cy="submission-report-row"]', `Submission ${submissionNumber} report`)
			.find('[data-cy="view-report"]')
			.invoke('attr', 'href')
			.then((href) => {
				cy.request(href as string).then((response) => {
					expect(response.status).to.equal(200);
					expect(response.headers['content-disposition']).to.include(`attachment; filename="${fileName}"`);
				});
			});
	}
}

export const gateway3SubmittedResubmissionPage = new Gateway3SubmittedResubmissionPage();
