export const GW2UpdateFileUploadedFromFO = (
	reference: string,
	fileName: string,
	updatedFileName: string,
	filePath: string
) => {
	const fullFilePath = filePath + fileName;

	cy.readFile(fullFilePath, 'base64').then((base64) => {
		cy.origin(
			Cypress.env('manageBaseUrl'),
			{ args: { reference, fileName, base64, updatedFileName } },
			({ reference, fileName, base64, updatedFileName }) => {
				const buffer = Cypress.Buffer.from(base64, 'base64');
				cy.visit(`/case/${encodeURIComponent(reference)}/gateway-2`);

				cy.contains('.govuk-summary-list__row', 'Submission documents')
					.contains('a', 'Review')
					.should('be.visible')
					.click();
				cy.contains('h1', 'Submitted GW2 documents').should('be.visible');
				cy.contains('.govuk-summary-list__row', 'Gateway 2 covering letter')
					.contains('.govuk-summary-list__value a', fileName)
					.should('be.visible');

				cy.contains('.govuk-summary-list__row', 'Gateway 2 covering letter')
					.contains('.govuk-link', 'Manage')
					.should('be.visible')
					.click();

				cy.contains('.govuk-summary-list__row', 'Documents')
					.contains('.govuk-summary-list__value a', fileName)
					.should('be.visible');

				cy.contains('.govuk-summary-list__row', 'Documents')
					.contains('.govuk-link', 'Change')
					.should('be.visible')
					.click();

				cy.contains('.pins-app-link-button', 'Remove').should('be.visible').click();
				cy.get('#gateway2CoverLetter-input').should('exist');
				cy.contains('.govuk-summary-list__row', `${fileName}`).should('not.exist');

				cy.contains('.govuk-summary-list__row', `${fileName}`).should('not.exist');

				cy.get(`#gateway2CoverLetter-input`).selectFile(
					{ contents: buffer, fileName: updatedFileName },
					{ force: true }
				);

				cy.contains('.govuk-button', 'Upload selected files').should('be.visible').click();

				cy.contains('.govuk-summary-list__row', `${updatedFileName}`).should('be.visible');

				cy.contains('.govuk-button', 'Continue').should('be.visible').click();

				cy.contains('.govuk-summary-list__row', 'Documents')
					.contains('.govuk-summary-list__value a', updatedFileName)
					.should('be.visible');

				cy.contains('.govuk-button', 'Upload document').should('be.visible').click();

				cy.contains('.govuk-summary-list__row', 'Gateway 2 covering letter')
					.contains('.govuk-summary-list__value a', updatedFileName)
					.should('be.visible');

				cy.contains('.govuk-summary-list__row', 'Gateway 2 covering letter')
					.contains('.govuk-summary-list__value a', fileName)
					.should('not.exist');
			}
		);
	});
};
