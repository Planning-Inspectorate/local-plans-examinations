export const verifyPortalSubmissionHintText = (reference: string, section: string, hintText: string) => {
	cy.origin(
		Cypress.env('portalBaseUrl'),
		{
			args: {
				reference,
				section,
				hintText
			}
		},
		({ reference, section, hintText }) => {
			cy.visit(`/manage-local-plans/${encodeURIComponent(reference)}`);
			cy.contains('.govuk-task-list__name-and-hint', `${section}`).should('contain.text', hintText);
		}
	);
};
