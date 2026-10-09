import { startPortalOtpLogin } from '../../../../flows/portal/login-flow.ts';
import { portalLoginOtpPage } from '../../../../page-objects/portal/login/otp-page.ts';

describe('Portal login OTP page', () => {
	beforeEach(() => {
		startPortalOtpLogin();
	});

	it('displays the OTP page content', { tags: ['smoke'] }, () => {
		portalLoginOtpPage.verifyHeading('Enter your one-time password');
		portalLoginOtpPage.verifyHintText('We sent a code to');
		portalLoginOtpPage.verifySaveAndContinueVisible();
		portalLoginOtpPage.verifyMainContains(
			'If you do not receive the email:',
			'Check the email address is correct.',
			'Check your spam or junk folder.',
			'If everything looks correct but you still have not received the email, you can request a new code.'
		);
	});

	it('displays the support details', { tags: ['regression'] }, () => {
		portalLoginOtpPage.verifyDetailsComponent('If you are still having problems');
	});
});
