import { completePortalLogin, startPortalOtpLogin } from '../../../../flows/portal/login-flow.ts';
import { portalLandingPage } from '../../../../page-objects/portal/landing-page.ts';
import { portalLoginEmailPage } from '../../../../page-objects/portal/login/email-page.ts';
import { portalLoginOtpPage } from '../../../../page-objects/portal/login/otp-page.ts';

describe('Portal login journey', () => {
	it('redirects to login when accessing the OTP page directly without a session', { tags: ['regression'] }, () => {
		cy.visit('/login/enter-code', { failOnStatusCode: false });

		portalLoginEmailPage.verifyPath();
	});

	it('redirects to the OTP page after a recognised email is submitted', { tags: ['smoke'] }, () => {
		startPortalOtpLogin();

		portalLoginOtpPage.verifyPath();
	});

	it('logs in and shows the landing page', { tags: ['smoke'] }, () => {
		startPortalOtpLogin();
		portalLoginOtpPage.verifyPath();

		completePortalLogin();

		portalLandingPage.verifyLoaded();
		portalLandingPage.verifyHeading('My plans');
	});

	it('user cannot access OPT page by using back link and typing in url', { tags: ['regression'] }, () => {
		startPortalOtpLogin();
		portalLoginOtpPage.verifyLoaded();
		portalLoginOtpPage.goBack();
		cy.visit('/login/enter-code', { failOnStatusCode: false });
		portalLoginOtpPage.verifyPageNotFound('/login/enter-code');
	});

	it.skip('requests a new code from the OTP page', { tags: ['notify'] }, () => {
		startPortalOtpLogin();
		portalLoginOtpPage.verifyPath();

		portalLoginOtpPage.clickRequestNewCode();

		portalLoginOtpPage.verifyNewCodeBanner();
	});
});
