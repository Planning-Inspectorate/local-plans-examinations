import { completePortalLogin, startPortalOtpLogin } from '../../../../flows/portal/login-flow.ts';
import { portalLandingPage } from '../../../../page-objects/portal/landing-page.ts';
import { portalLoginOtpPage } from '../../../../page-objects/portal/login/otp-page.ts';

describe('Portal login journey', () => {
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
});
