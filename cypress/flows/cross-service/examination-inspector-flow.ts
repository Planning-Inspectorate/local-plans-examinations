export const assignExaminationInspectorInManage = (reference: string, inspector: string) => {
	cy.origin(Cypress.env('manageBaseUrl'), { args: { reference, inspector } }, ({ reference, inspector }) => {
		cy.visit(`/case/${encodeURIComponent(reference)}/examination`);
		cy.contains('.govuk-summary-list__key', 'Examining Inspector 1')
			.parent('.govuk-summary-list__row')
			.find('.govuk-summary-list__actions a')
			.click();

		cy.get('input#examiningInspector1').should('be.visible').clear().type(inspector);
		cy.get('#examiningInspector1__listbox').contains('[role="option"]', inspector).should('be.visible').click();
		cy.get('[data-cy="button-save-and-continue"]').click();

		cy.contains('.govuk-summary-list__key', 'Examining Inspector 1')
			.parent('.govuk-summary-list__row')
			.should('contain.text', inspector);
	});
};
