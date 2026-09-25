export const verifyGateway2ReportInPortal = (reference: string, fileName: string, sharedDate: string) => {
	cy.origin(
		Cypress.env('portalBaseUrl'),
		{ args: { reference, fileName, sharedDate } },
		({ reference, fileName, sharedDate }) => {
			cy.visit('/manage-local-plans/your-plans');
			cy.contains('tr', reference).should('be.visible').and('contain.text', 'Gateway 3');

			cy.contains('[data-cy="plan-link"]', reference).click();
			cy.get('[data-cy="plan-progress"], section[aria-labelledby="plan-progress-heading"]')
				.contains('a', 'Gateway 2 - advisory check')
				.click();

			cy.contains('.govuk-summary-list__key', 'Gateway 2 report')
				.parent('.govuk-summary-list__row')
				.find('.govuk-summary-list__value')
				.should('contain.text', fileName)
				.and('contain.text', `(shared on ${sharedDate})`);
		}
	);
};
