export const verifyExaminationFinalReportDocumentsInPortal = (
	reference: string,
	fileNames: string[],
	sharedDate: string
) => {
	cy.origin(
		Cypress.env('portalBaseUrl'),
		{ args: { reference, fileNames, sharedDate } },
		({ reference, fileNames, sharedDate }) => {
			cy.visit('/manage-local-plans/your-plans');
			cy.contains('tbody tr', reference)
				.should('be.visible')
				.find('th, td')
				.should('have.length', 3)
				.eq(2)
				.should('contain.text', 'Local Plan');

			cy.contains('[data-cy="plan-link"]', reference).click();
			cy.location('pathname').should('eq', `/manage-local-plans/${reference}`);
			cy.get('[data-cy="plan-progress"], section[aria-labelledby="plan-progress-heading"]')
				.contains('a', 'Examination')
				.click();
			cy.location('pathname').should('eq', `/manage-local-plans/${reference}/examination`);

			cy.get('[data-cy="examination-report-label"]').should('contain.text', 'Examination report');
			cy.get('[data-cy="examination-report-value"]')
				.should('contain.text', `(issued on ${sharedDate})`)
				.within(() => {
					fileNames.forEach((fileName) => {
						cy.contains('a', fileName).should('be.visible');
					});
				});

			cy.contains('.govuk-tag', 'Report issued').should('be.visible');
		}
	);
};
