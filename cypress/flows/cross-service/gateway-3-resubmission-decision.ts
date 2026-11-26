export const issueGateway3ResubmissionDecisionInManage = (
	reference: string,
	lpaFileName: string,
	reportFileName: string
) => {
	cy.fixture(`files/${reportFileName}`, 'base64').then((contents) => {
		cy.origin(
			Cypress.env('manageBaseUrl'),
			{ args: { reference, lpaFileName, reportFileName, contents } },
			({ reference, lpaFileName, reportFileName, contents }) => {
				const reviewDocumentsPath = `/case/${encodeURIComponent(reference)}/gateway-3/gateway-3-submission-2/gateway-3-review-documents-2`;

				cy.visit(reviewDocumentsPath);
				cy.contains('h1', 'Gateway 3 documents').should('be.visible');
				cy.get('main').should('contain.text', lpaFileName);
				cy.get('[data-cy="issue-decision-button"]').should('be.visible').click();

				cy.contains('h1', 'What is the outcome of your Gateway 3 decision').should('be.visible');
				cy.get('[data-cy="answer-1"]').check();
				cy.get('[data-cy="button-save-and-continue"]').click();

				cy.contains('h1', 'Upload Gateway 3 report').should('be.visible');
				cy.get('main').should('not.contain.text', lpaFileName);

				cy.get('#gateway3Documents-2-input').selectFile(
					{ contents: Cypress.Buffer.from(contents, 'base64'), fileName: reportFileName },
					{ force: true }
				);
				cy.get('[data-cy="upload-files-button"]').click();
				cy.get('.govuk-summary-list__value').should('contain.text', reportFileName);
				cy.get('[data-cy="save-and-return-button"]').click();

				cy.contains('h1', 'Check gateway 3 decision and report details').should('be.visible');
				cy.contains('.govuk-summary-list__row', 'Outcome').should('contain.text', 'Proceed to examination');
				cy.get('main').should('contain.text', reportFileName).and('not.contain.text', lpaFileName);
				cy.contains('button', 'Issue decision').click();

				cy.get('.govuk-summary-list__row')
					.filter(':contains("Gateway 3 decision")')
					.eq(1)
					.should('contain.text', 'Proceed to examination');

				cy.visit(reviewDocumentsPath);
				cy.contains('h1', 'Gateway 3 documents').should('be.visible');
				cy.get('main').should('contain.text', lpaFileName).and('not.contain.text', reportFileName);
			}
		);
	});
};
