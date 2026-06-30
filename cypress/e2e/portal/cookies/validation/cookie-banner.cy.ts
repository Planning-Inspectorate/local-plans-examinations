import { portalHomePage } from '../../../../page-objects/portal/home-page.ts';
import { portalCookieBanner } from '../../../../page-objects/portal/cookies/cookie-banner.ts';

describe('Portal cookie banner', () => {
	beforeEach(() => {
		cy.clearCookies();
	});

	it('links to the cookies page', { tags: ['smoke'] }, () => {
		portalHomePage.visit();
		portalCookieBanner.verifyVisible();

		portalCookieBanner.viewCookies();
		cy.location('pathname').should('eq', '/cookies');
	});

	it('does not show the banner on later visits after accepting analytics cookies', { tags: ['regression'] }, () => {
		portalHomePage.visit();
		portalCookieBanner.verifyVisible();

		portalCookieBanner.acceptAnalyticsCookies();
		portalCookieBanner.verifyConsentCookie('accept');

		cy.reload();
		portalCookieBanner.verifyHidden();
	});

	it('does not show the banner on later visits after rejecting analytics cookies', { tags: ['regression'] }, () => {
		portalHomePage.visit();
		portalCookieBanner.verifyVisible();

		portalCookieBanner.rejectAnalyticsCookies();
		portalCookieBanner.verifyConsentCookie('reject');

		cy.reload();
		portalCookieBanner.verifyHidden();
	});
});
