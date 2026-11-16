import { authenticatePortalIfRequired } from '../../flows/auth-flow.ts';
import { portalHomePage } from '../../page-objects/portal/home-page.ts';

describe('Portal home', () => {
	beforeEach(() => {
		authenticatePortalIfRequired();
	});

	it('redirects to the login page', { tags: ['smoke', 'environment-smoke'] }, () => {
		portalHomePage.visit();
		cy.location('pathname').should('eq', '/login');
		portalHomePage.verifyHeading('Sign-in');
	});
});
