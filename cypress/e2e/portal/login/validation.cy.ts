import { portalLoginPage } from '../../../page-objects/portal/login-page.ts';
import { portalOtpPage } from '../../../page-objects/portal/otp-page.ts';

const TEST_EMAIL = 'test@planninginspectorate.gov.uk';

describe('Login Validation - Email Entry', () => {
	beforeEach(() => {
		portalLoginPage.visit();
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

describe('Login Validation - OTP Entry', () => {
	beforeEach(() => {
		cy.task('seedCase');
		portalLoginPage.visit();
		portalLoginPage.enterEmail(TEST_EMAIL);
		portalLoginPage.saveAndContinue();
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

	it.skip('shows success banner after requesting a new code', { tags: ['notify'] }, () => {
		portalOtpPage.clickRequestNewCode();
		portalOtpPage.verifyNewCodeBanner();
	});
});
