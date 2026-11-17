import { examinationSubmissionWebsite } from '../../fixtures/portal/examination-website.ts';
import { examinationUploadAnswers } from '../../fixtures/portal/examination-uploads.ts';

export const uploadExaminationDocumentInPortal = (reference: string, fileName: string) => {
	// Read binary fixtures before cy.origin, as in the Gateway 3 submission flow.
	cy.fixture(`files/${fileName}`, 'base64').then((contents) => {
		cy.origin(
			Cypress.env('portalBaseUrl'),
			{
				args: {
					reference,
					fileName,
					contents,
					website: examinationSubmissionWebsite,
					upload: examinationUploadAnswers.localPlanSubmissionForExamination
				}
			},
			({ reference, fileName, contents, website, upload }) => {
				cy.visit(`/manage-local-plans/${encodeURIComponent(reference)}/examination`);
				cy.contains('h1', 'Examination').should('be.visible');
				cy.get(`[data-cy="${website.addCy}"]`).click();
				cy.get(`#${website.fieldName}`).clear().type(website.updatedValue);
				cy.get('[data-cy="button-save-and-continue"]').click();

				cy.get(`[data-cy="${upload.addCy}"]`).click();
				cy.contains('h1', upload.heading).should('be.visible');
				cy.get(`#${upload.fieldName}-input`).selectFile(
					{ contents: Cypress.Buffer.from(contents, 'base64'), fileName },
					{ force: true }
				);
				cy.get('[data-cy="upload-files-button"]').click();
				cy.get('.govuk-summary-list__value').should('contain.text', fileName);
				cy.get('[data-cy="save-and-return-button"]').click();
				cy.contains('h1', 'Examination').should('be.visible');
			}
		);
	});
	cy.task('setDocumentVirusCheckStatus', { reference, fileName, status: 'scanned' });
};

export const submitExaminationInPortal = (reference: string) => {
	cy.origin(Cypress.env('portalBaseUrl'), { args: { reference } }, ({ reference }) => {
		cy.visit(`/manage-local-plans/${encodeURIComponent(reference)}/examination`);
		cy.get('[data-cy="submit-examination"]').click();
		cy.contains('h1', "Are you sure you're ready to submit?").should('be.visible');
		cy.get('[data-cy="confirm-submission"]').click();
		cy.location('pathname').should('eq', `/manage-local-plans/${reference}/examination/submission-complete`);
		cy.contains('h1', 'Submission complete').should('be.visible');
	});
};
