import { portalLoginPage } from '../../../page-objects/portal/login-page.ts';
import { portalOtpPage } from '../../../page-objects/portal/otp-page.ts';
import { portalLandingPage } from '../../../page-objects/portal/landing-page.ts';

const TEST_EMAIL = 'test@planninginspectorate.gov.uk';

describe('Login Journey', () => {
	it('completes full login flow and reaches landing page', { tags: ['smoke'] }, () => {
		cy.task('seedCase');
		portalLoginPage.visit();
		portalLoginPage.enterEmail(TEST_EMAIL);
		portalLoginPage.saveAndContinue();

		portalOtpPage.verifyPath();

		// Seed OTP after email submission so it overwrites the controller-generated OTP
		cy.task('seedOtp').then((otp) => {
			portalOtpPage.enterOtp(otp as string);
			portalOtpPage.saveAndContinue();

			portalLandingPage.verifyPath();
		});
	});
});
