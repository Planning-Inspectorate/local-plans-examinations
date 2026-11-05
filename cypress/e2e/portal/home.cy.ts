import { portalHomePage } from '../../page-objects/portal/home-page.ts';

describe('Portal home', () => {
	it('redirects to the login page', { tags: ['smoke', 'environment-smoke'] }, () => {
		portalHomePage.visit();
		cy.location('pathname').should('eq', '/login');
		portalHomePage.verifyHeading('Sign-in');
	});
});
