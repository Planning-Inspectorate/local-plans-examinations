import { startPortalOtpLogin } from '../../../../flows/portal/login-flow.ts';
import { portalLoginOtpPage } from '../../../../page-objects/portal/login/otp-page.ts';

describe('Portal login OTP validation', () => {
	beforeEach(() => {
		startPortalOtpLogin();
	});

	it('shows an error when no code is entered', { tags: ['regression'] }, () => {
		portalLoginOtpPage.saveAndContinue();

		portalLoginOtpPage.verifyErrorSummaryContains('You have not entered a code');
		portalLoginOtpPage.verifyFieldErrorContains('Enter the code we sent to your email address');
	});

	it('shows an error for an incorrect code', { tags: ['regression'] }, () => {
		portalLoginOtpPage.enterOtp('WRONGCODE');
		portalLoginOtpPage.saveAndContinue();

		portalLoginOtpPage.verifyErrorSummaryContains('The code you entered is incorrect');
		portalLoginOtpPage.verifyFieldErrorContains('Enter the code we sent to your email address');
	});
});
