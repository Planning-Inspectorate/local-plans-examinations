export const verifyGateway3CompletedInPortal = (
	reference: string,
	fileName: string,
	completedDate: string,
	examinationTargetDate: string
) => {
	cy.origin(
		Cypress.env('portalBaseUrl'),
		{ args: { reference, fileName, completedDate, examinationTargetDate } },
		({ reference, fileName, completedDate, examinationTargetDate }) => {
			const planProgress = () => cy.get('[data-cy="plan-progress"], section[aria-labelledby="plan-progress-heading"]');
			const progressRow = (title: string) => planProgress().contains('.govuk-task-list__item', title);

			cy.visit(`/manage-local-plans/${encodeURIComponent(reference)}`);

			progressRow('Gateway 3 - readiness check')
				.should('contain.text', `Completed: ${completedDate}`)
				.and('contain.text', 'Completed');

			progressRow('Examination')
				.should('contain.text', `Target date: ${examinationTargetDate}`)
				.and('contain.text', 'Ready to start');

			planProgress().contains('a', 'Examination').click();
			cy.location('pathname').should('eq', `/manage-local-plans/${reference}/examination`);
			cy.contains('h1', 'Examination').should('be.visible');

			cy.visit(`/manage-local-plans/${encodeURIComponent(reference)}/gateway-3-submission`);
			cy.get('[data-cy="gateway-3-report-section"]')
				.should('contain.text', 'Gateway 3 report')
				.and('contain.text', fileName)
				.and('contain.text', `(shared on ${completedDate})`);
		}
	);
};
