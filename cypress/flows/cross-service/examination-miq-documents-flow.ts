export const verifyExaminationMIQDocumentsInPortal = (
	reference: string,
	fileNames: string[] = [],
	sharedDate: string
) => {
	cy.origin(
		Cypress.env('portalBaseUrl'),
		{ args: { reference, fileNames, sharedDate } },
		({ reference, fileNames, sharedDate }) => {
			cy.visit('/manage-local-plans/your-plans');
			cy.contains('tr', reference).should('be.visible').and('contain.text', 'Examination');

			cy.contains('[data-cy="plan-link"]', reference).click();
			cy.location('pathname').should('eq', `/manage-local-plans/${reference}`);
			cy.get('[data-cy="plan-progress"], section[aria-labelledby="plan-progress-heading"]')
				.contains('a', 'Examination')
				.click();
			cy.location('pathname').should('eq', `/manage-local-plans/${reference}/examination`);

			cy.contains('.govuk-summary-list__key', 'Matters, issues and questions')
				.closest('.govuk-summary-list__row')
				.find('.govuk-summary-list__value')
				.within(() => {
					fileNames.forEach((docName) => {
						cy.contains(docName).should('be.visible');
					});
				})
				.and('contain.text', `(issued on ${sharedDate})`);
		}
	);
};
