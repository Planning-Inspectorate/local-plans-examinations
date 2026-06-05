describe('Case overview', () => {
	beforeEach(() => {
		cy.task('clearDb');
	});

	after(() => cy.task('clearDb'));

	it('home page should display message when no cases exist', () => {
		cy.visit('/');
		cy.get('[data-cy="page-title"]').should('contain', 'All cases');
		cy.get('[data-cy="create-a-case"]').should('contain', 'Create a case');
		cy.get('[data-cy="no-cases"]').should('contain', 'No cases have been created yet.');
	});

	it('should display a list of cases', () => {
		cy.task('seedDb', { setTimeout: 2000 });
		cy.visit('/');
		cy.get('[data-cy="page-title"]').should('contain', 'All cases (1)');
	});

	it('can view detailed overview of a case', () => {
		cy.task('seedDb', { setTimeout: 2000 });
		cy.visit('/');
		cy.get('tbody > tr > td:nth-child(1) > a').click();
		cy.get('[data-cy="main-heading"]').should('contain', 'Cypress Test Plan');
		cy.get('[data-cy="service-navigation"').should('contain', 'Overview');
		cy.get('[data-cy="service-navigation"').should('contain', 'Timetable');
		cy.get('[data-cy="service-navigation"').should('contain', 'Gateway 1');
		cy.get('[data-cy="service-navigation"').should('contain', 'Gateway 2');
		cy.get('[data-cy="service-navigation"').should('contain', 'Gateway 3');
		cy.get('[data-cy="service-navigation"').should('contain', 'Examination');
		cy.get('[data-cy="service-navigation"').should('contain', 'Case History');
	});
});
