import { Gateway3ResubmissionPage } from './gateway-3-resubmission-page.ts';

export class Gateway3PreviousSubmissionPage extends Gateway3ResubmissionPage {
	constructor() {
		super(/^\/manage-local-plans\/[^/]+\/gateway-3-resubmission\/submission\/[^/]+$/);
	}

	get submissionCopy() {
		return cy.getByData('submission-copy');
	}

	get requiredInformationTable() {
		return cy.getByData('required-information-table');
	}

	pathFor(planReference: string, submissionNumber: number | string = 1) {
		return `/manage-local-plans/${planReference}/gateway-3-resubmission/submission/${submissionNumber}`;
	}

	visitSubmission(planReference: string, submissionNumber: number) {
		cy.visit(this.pathFor(planReference, submissionNumber));
	}

	verifyNoEditingControls() {
		cy.getByData('add-documents').should('not.exist');
		this.submitButton.should('not.exist');
		this.saveAndComeBackLink.should('not.exist');
	}

	verifyLoaded(submissionNumber?: string, status = 'Resubmission required') {
		this.verifyPath();
		this.verifyHeading(submissionNumber ? `Gateway 3; submission ${submissionNumber}` : 'Gateway 3; submission');
		if (status === 'Resubmission required') {
			this.verifyResubmissionTag();
		} else {
			cy.getByData('status-tag').should('be.visible').and('have.text', status);
		}
	}

	verifySubmissionCopy(date: string, time: string, submitter: string) {
		this.submissionCopy.should('have.text', `Your submission was sent on ${date} at ${time} by ${submitter}.`);
	}
}

export const gateway3PreviousSubmissionPage = new Gateway3PreviousSubmissionPage();
