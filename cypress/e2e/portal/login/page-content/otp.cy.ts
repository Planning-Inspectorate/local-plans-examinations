import { startPortalOtpLogin } from '../../../../flows/portal/login-flow.ts';
import { portalLoginOtpPage } from '../../../../page-objects/portal/login/otp-page.ts';

describe('Portal login OTP page', () => {
	beforeEach(() => {
		startPortalOtpLogin();
	});

	it('displays the OTP page content', { tags: ['smoke'] }, () => {
		portalLoginOtpPage.verifyHeading('Enter your One Time Password (OTP)');
		portalLoginOtpPage.verifyHintText('Enter the code which was emailed to');
		portalLoginOtpPage.verifySaveAndContinueVisible();
	});

	it('displays the support details', { tags: ['regression'] }, () => {
		portalLoginOtpPage.verifyDetailsComponent('If you are still having problems');
	});
});
