export const verifyGateway3CompletedInPortal = (
	reference: string,
	fileName: string,
	completedDate: string,
	gateway3TargetDate: string,
	examinationTargetDate: string
) => {
	cy.origin(
		Cypress.env('portalBaseUrl'),
		{ args: { reference, fileName, completedDate, gateway3TargetDate, examinationTargetDate } },
		({ reference, fileName, completedDate, gateway3TargetDate, examinationTargetDate }) => {
			const planProgress = () => cy.get('[data-cy="plan-progress"], section[aria-labelledby="plan-progress-heading"]');
			const progressRow = (title: string) => planProgress().contains('.govuk-task-list__item', title);

			cy.visit(`/manage-local-plans/${encodeURIComponent(reference)}`);

			progressRow('Gateway 3')
				.should('contain.text', `Submission expected: ${gateway3TargetDate}`)
				.find('.govuk-task-list__status')
				.should('contain.text', 'Completed');
			progressRow('Gateway 3')
				.should('contain.text', `Submission expected: ${gateway3TargetDate}`)
				.and('contain.text', 'Completed');

			progressRow('Examination')
				.should('contain.text', `Submission expected: ${examinationTargetDate}`)
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
