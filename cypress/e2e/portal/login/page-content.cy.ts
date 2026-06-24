import { portalLoginPage } from '../../../page-objects/portal/login-page.ts';
import { portalOtpPage } from '../../../page-objects/portal/otp-page.ts';

const TEST_EMAIL = 'test@planninginspectorate.gov.uk';

describe('Login Page Content - Email Entry', () => {
	beforeEach(() => {
		portalLoginPage.visit();
	});

	it('displays the sign-in page with correct elements', { tags: ['smoke'] }, () => {
		portalLoginPage.verifyHeading('What is your email address?');
		portalLoginPage.verifySaveAndContinueVisible();
	});
});

describe('Login Page Content - OTP Entry', () => {
	beforeEach(() => {
		cy.task('seedCase');
		portalLoginPage.visit();
		portalLoginPage.enterEmail(TEST_EMAIL);
		portalLoginPage.saveAndContinue();
	});

	it('displays the OTP page with correct elements', { tags: ['smoke'] }, () => {
		portalOtpPage.verifyHeading('Enter your One Time Password (OTP)');
		portalOtpPage.verifyHintText('Enter the code which was emailed to');
		portalOtpPage.verifySaveAndContinueVisible();
	});

	it('displays the details component for support', { tags: ['regression'] }, () => {
		portalOtpPage.verifyDetailsComponent('If you are still having problems');
	});
});
