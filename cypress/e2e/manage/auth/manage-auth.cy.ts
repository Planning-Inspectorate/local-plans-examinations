import { authenticateManageIfRequired, skipUnlessRealEnvironmentAuth } from '../../../flows/auth-flow.ts';
import { manageHomePage } from '../../../page-objects/manage/home-page.ts';

describe('Manage authentication', () => {
	before(function () {
		skipUnlessRealEnvironmentAuth(this);
	});

	it('redirects unauthenticated users to sign in', { tags: ['smoke', 'environment-smoke'] }, () => {
		cy.clearCookies();

		cy.request({
			failOnStatusCode: false,
			followRedirect: false,
			url: '/'
		}).then((response) => {
			expect([302, 303]).to.include(response.status);
			expect(response.headers.location).to.match(/\/auth|login\.microsoftonline\.com/);
		});
	});

	it('allows an authorised user to view Manage', { tags: ['smoke', 'environment-smoke'] }, () => {
		authenticateManageIfRequired();

		manageHomePage.visit();
		manageHomePage.verifyHeading('All cases');
	});
});
