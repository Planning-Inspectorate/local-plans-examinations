export const verifyGateway2WorkshopInPortal = (
	reference: string,
	workshopVenue: string[],
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
			cy.location('pathname').should('eq', `/manage-local-plans/${reference}`);
			cy.get('[data-cy="plan-progress"], section[aria-labelledby="plan-progress-heading"]')
				.contains('a', 'Gateway 2')
				.click();
			cy.location('pathname').should('include', `/manage-local-plans/${reference}/gateway-2-submission`);
			cy.get('[data-cy="gateway-2-workshop-section"]').contains('h2', 'Workshop').should('be.visible');

			cy.contains('.govuk-summary-list__key', 'Venue')
				.closest('.govuk-summary-list__row')
				.find('.govuk-summary-list__value')
				.then(($venue) => {
					workshopVenue.forEach((line) => expect($venue.text()).to.contain(line));
				});

			cy.contains('.govuk-summary-list__key', 'Start time')
				.closest('.govuk-summary-list__row')
				.find('.govuk-summary-list__value')
				.should('contain.text', workshopDateandTime);

			if (workshopDocuments.length > 0) {
				cy.contains('.govuk-summary-list__key', 'Documents')
					.closest('.govuk-summary-list__row')
					.find('.govuk-summary-list__value')
					.within(() => {
						workshopDocuments.forEach((docName) => {
							cy.contains(docName).should('be.visible');
						});
					});

				cy.visit(`/manage-local-plans/${encodeURIComponent(reference)}`);
				cy.contains('.govuk-task-list__item', 'Gateway 2')
					.find('.govuk-task-list__status')
					.should('contain.text', 'Under review');
			} else {
				cy.get('[data-cy="gateway-2-workshop-section"]')
					.contains('.govuk-summary-list__key', 'Documents')
					.should('not.exist');
			}
		}
	);
};
