import { startPortalOtpLogin } from '../../../../flows/portal/login-flow.ts';
import { portalLoginOtpPage } from '../../../../page-objects/portal/login/otp-page.ts';
import { ERROR_MESSAGES } from '../../../../constants/portal/error-messages.ts';

describe('Portal login OTP validation', () => {
	beforeEach(() => {
		startPortalOtpLogin();
	});

	it('shows an error when no code is entered', { tags: ['regression'] }, () => {
		portalLoginOtpPage.saveAndContinue();

		portalLoginOtpPage.verifyErrorSummary(ERROR_MESSAGES.NO_CODE_ENTERED_SUMMARY, ERROR_MESSAGES.ENTER_CODE_SENT);
		portalLoginOtpPage.verifyFieldErrorContains(ERROR_MESSAGES.ENTER_CODE_SENT);
	});

	it('shows an error for an incorrect code', { tags: ['regression'] }, () => {
		portalLoginOtpPage.enterOtp('WRONGCODE');
		portalLoginOtpPage.saveAndContinue();

		portalLoginOtpPage.verifyErrorSummary(ERROR_MESSAGES.INCORRECT_CODE_SUMMARY, ERROR_MESSAGES.ENTER_CODE_SENT);
		portalLoginOtpPage.verifyFieldErrorContains(ERROR_MESSAGES.ENTER_CODE_SENT);
	});
});
