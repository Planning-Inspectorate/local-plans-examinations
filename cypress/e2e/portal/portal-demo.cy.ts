describe('Portal Demo Tests', () => {
	it('should load the portal homepage', () => {
		cy.visit('/');
		cy.get('.govuk-heading-l').contains('This is the home page');
		cy.get('[data-cy="db-connection"]').contains('Successfully connected to the database.');
	});
});
