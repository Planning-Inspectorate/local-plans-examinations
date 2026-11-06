import { examinationWebsite } from '../../fixtures/portal/examination-website.ts';
import { gateway3UploadAnswers } from '../../fixtures/portal/gateway-3-uploads.ts';

export const uploadGateway3DocumentInPortal = (reference: string, fileName: string) => {
	// Read binary fixtures before cy.origin; pass serialisable bytes to the upload command.
	cy.fixture(`files/${fileName}`, 'base64').then((contents) => {
		cy.origin(
			Cypress.env('portalBaseUrl'),
			{
				args: {
					reference,
					fileName,
					contents,
					website: examinationWebsite,
					upload: gateway3UploadAnswers.environmentalReport
				}
			},
			({ reference, fileName, contents, website, upload }) => {
				cy.visit(`/manage-local-plans/${encodeURIComponent(reference)}/gateway-3-submission`);
				cy.contains('h1', 'Gateway 3 submission').should('be.visible');
				cy.get(`[data-cy="${website.addCy}"]`).click();
				cy.get(`#${website.fieldName}`).clear().type(website.value);
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
				cy.contains('h1', 'Gateway 3 submission').should('be.visible');
				cy.contains('.govuk-tag', 'In progress').should('be.visible');
			}
		);
	});
	cy.task('setDocumentVirusCheckStatus', { reference, fileName, status: 'scanned' });
};

export const submitGateway3InPortal = (reference: string) => {
	cy.origin(Cypress.env('portalBaseUrl'), { args: { reference } }, ({ reference }) => {
		cy.visit(`/manage-local-plans/${encodeURIComponent(reference)}/gateway-3-submission`);
		cy.get('[data-cy="submit-gateway-3"]').click();
		cy.contains('h1', "Are you sure you're ready to submit?").should('be.visible');
		cy.get('[data-cy="confirm-submission"]').click();
		cy.location('pathname').should(
			'equal',
			`/manage-local-plans/${reference}/gateway-3-submission/submission-complete`
		);
		cy.contains('h1', 'Gateway 3 submission complete').should('be.visible');

		cy.visit(`/manage-local-plans/${encodeURIComponent(reference)}`);
		cy.contains('.govuk-task-list__item', 'Gateway 3 - readiness check')
			.find('.govuk-task-list__status')
			.should('contain.text', 'Under review');
	});
};
