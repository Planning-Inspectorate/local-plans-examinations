export const verifyGateway2WorkshopInPortal = (
	reference: string,
	workshopVenue: string,
	workshopDateandTime: string,
	workshopDocuments: string[] = []
) => {
	cy.origin(
		Cypress.env('portalBaseUrl'),
		{ args: { reference, workshopVenue, workshopDateandTime, workshopDocuments } },
		({ reference, workshopVenue, workshopDateandTime, workshopDocuments }) => {
			cy.visit('/manage-local-plans/your-plans');
			cy.contains('tbody tr', reference)
				.should('be.visible')
				.find('th, td')
				.should('have.length', 3)
				.eq(2)
				.should('contain.text', 'Local Plan');

			cy.contains('[data-cy="plan-link"]', reference).click();
			cy.get('[data-cy="plan-progress"], section[aria-labelledby="plan-progress-heading"]')
				.contains('a', 'Gateway 2 - advisory check')
				.click();

			cy.contains('.govuk-summary-list__key', 'Workshop venue')
				.closest('.govuk-summary-list__row')
				.find('.govuk-summary-list__value')
				.should('contain.text', workshopVenue);

			cy.contains('.govuk-summary-list__key', 'Workshop date and time')
				.closest('.govuk-summary-list__row')
				.find('.govuk-summary-list__value')
				.should('contain.text', workshopDateandTime);

			if (workshopDocuments.length > 0) {
				cy.contains('.govuk-summary-list__key', 'Workshop documents')
					.closest('.govuk-summary-list__row')
					.find('.govuk-summary-list__value')
					.within(() => {
						workshopDocuments.forEach((docName) => {
							cy.contains(docName).should('be.visible');
						});
					});
			}
		}
	);
};
