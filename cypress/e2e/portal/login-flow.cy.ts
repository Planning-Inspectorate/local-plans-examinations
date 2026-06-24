import { portalLoginPage } from '../../pageObjects/portal/login-page.ts';
import { portalOtpPage } from '../../pageObjects/portal/otp-page.ts';
import { portalLandingPage } from '../../pageObjects/portal/landing-page.ts';

const TEST_EMAIL = 'test@planninginspectorate.gov.uk';

describe('Login Flow - Email Entry', () => {
	beforeEach(() => {
		portalLoginPage.visit();
	});

	it('displays the sign-in page with correct elements', { tags: ['smoke'] }, () => {
		portalLoginPage.verifyHeading('What is your email address?');
		portalLoginPage.verifySaveAndContinueVisible();
	});

	it('shows error when no email is entered', { tags: ['regression'] }, () => {
		portalLoginPage.saveAndContinue();
		portalLoginPage.verifyValidationError('Enter your email address');
	});

	it('shows error for invalid email format', { tags: ['regression'] }, () => {
		portalLoginPage.enterEmail('invalid-email');
		portalLoginPage.saveAndContinue();
		portalLoginPage.verifyValidationError('Enter the valid email address your reference number was sent to');
	});

	it('shows error for unrecognised email', { tags: ['regression'] }, () => {
		portalLoginPage.enterEmail('unknown@example.com');
		portalLoginPage.saveAndContinue();
		portalLoginPage.verifyErrorSummaryContains('We did not recognise that email address');
	});

	it('redirects to OTP page on valid email submission', { tags: ['smoke'] }, () => {
		cy.task('seedCase');
		portalLoginPage.enterEmail(TEST_EMAIL);
		portalLoginPage.saveAndContinue();
		portalOtpPage.verifyPath();
	});
});

describe('Login Flow - OTP Entry', () => {
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

	it('shows error when no code is entered', { tags: ['regression'] }, () => {
		portalOtpPage.saveAndContinue();
		portalOtpPage.verifyErrorSummaryContains('You have not entered a code');
		portalOtpPage.verifyFieldErrorContains('Enter the code we sent to your email address');
	});

	it('shows error for incorrect code', { tags: ['regression'] }, () => {
		portalOtpPage.enterOtp('WRONGCODE');
		portalOtpPage.saveAndContinue();
		portalOtpPage.verifyErrorSummaryContains('The code you entered is incorrect');
		portalOtpPage.verifyFieldErrorContains('Enter the code we sent to your email address');
	});

	it('displays the details component for support', { tags: ['regression'] }, () => {
		portalOtpPage.verifyDetailsComponent('If you are still having problems');
	});

	it.skip('shows success banner after requesting a new code', { tags: ['notify'] }, () => {
		portalOtpPage.clickRequestNewCode();
		portalOtpPage.verifyNewCodeBanner();
	});
});

describe('Login Flow - Full Journey to Landing Page', () => {
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
