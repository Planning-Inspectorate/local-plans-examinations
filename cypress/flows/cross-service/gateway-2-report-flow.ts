export const verifyGateway2ReportInPortal = (reference: string, fileName: string, sharedDate: string) => {
	cy.origin(
		Cypress.env('portalBaseUrl'),
		{ args: { reference, fileName, sharedDate } },
		({ reference, fileName, sharedDate }) => {
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

			cy.contains('.govuk-summary-list__key', 'Gateway 2 report')
				.parent('.govuk-summary-list__row')
				.find('.govuk-summary-list__value')
				.should('contain.text', fileName)
				.and('contain.text', `(shared on ${sharedDate})`);

			cy.visit(`/manage-local-plans/${encodeURIComponent(reference)}`);
			cy.contains('.govuk-task-list__item', 'Gateway 2')
				.find('.govuk-task-list__status')
				.should('contain.text', 'Completed');
			cy.contains('.govuk-task-list__item', 'Gateway 3')
				.find('.govuk-task-list__status')
				.should('contain.text', 'Ready to start');
		}
	);
};

export const verifyGateway2ReportNotIssuedInPortal = (reference: string) => {
	cy.origin(Cypress.env('portalBaseUrl'), { args: { reference } }, ({ reference }) => {
		cy.visit(`/manage-local-plans/${encodeURIComponent(reference)}/gateway-2-submission`);
		cy.get('[data-cy="gateway-2-report-section"]').should('not.exist');

		cy.visit(`/manage-local-plans/${encodeURIComponent(reference)}`);
		cy.contains('.govuk-task-list__item', 'Gateway 2')
			.find('.govuk-task-list__status')
			.should('contain.text', 'Under review');
		cy.contains('.govuk-task-list__item', 'Gateway 3')
			.should('contain.text', 'Cannot start yet')
			.find('a')
			.should('not.exist');
	});
};
