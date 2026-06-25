import { portalLoginEmailPage } from '../../page-objects/portal/login/email-page.ts';
import { portalLoginOtpPage } from '../../page-objects/portal/login/otp-page.ts';

export const TEST_EMAIL = 'test@planninginspectorate.gov.uk';

export const startPortalOtpLogin = (email = TEST_EMAIL) => {
	cy.task('seedCase');
	portalLoginEmailPage.visit();
	portalLoginEmailPage.enterEmail(email);
	portalLoginEmailPage.saveAndContinue();
};

export const completePortalLogin = () => {
	cy.task('seedOtp').then((otp) => {
		portalLoginOtpPage.enterOtp(String(otp));
		portalLoginOtpPage.saveAndContinue();
	});
};
