import { portalLoginEmailPage } from '../../../../page-objects/portal/login/email-page.ts';

describe('Portal login email validation', () => {
	beforeEach(() => {
		portalLoginEmailPage.visit();
	});

	it('shows an error when no email is entered', { tags: ['regression'] }, () => {
		portalLoginEmailPage.saveAndContinue();

		portalLoginEmailPage.verifyValidationError('Enter your email address');
	});

	it('shows an error for an invalid email format', { tags: ['regression'] }, () => {
		portalLoginEmailPage.enterEmail('invalid-email');
		portalLoginEmailPage.saveAndContinue();

		portalLoginEmailPage.verifyValidationError('Enter the valid email address your reference number was sent to');
	});

	it('shows an error for an unrecognised email', { tags: ['regression'] }, () => {
		portalLoginEmailPage.enterEmail('unknown@example.com');
		portalLoginEmailPage.saveAndContinue();

		portalLoginEmailPage.verifyErrorSummaryContains('We did not recognise that email address');
	});
});
