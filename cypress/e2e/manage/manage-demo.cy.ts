describe('Manage Demo Tests', () => {
	it('should load the manage homepage', () => {
		cy.visit('/');
		cy.get('[data-cy="main-heading"]').contains('Some Service Name');
	});
});
