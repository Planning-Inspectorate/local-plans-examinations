import { portalLoginEmailPage } from '../../../../page-objects/portal/login/email-page.ts';
import { ERROR_MESSAGES } from '../../../../constants/portal/error-messages.ts';

describe('Portal login email validation', () => {
	beforeEach(() => {
		portalLoginEmailPage.visit();
	});

	it('shows an error when no email is entered', { tags: ['regression'] }, () => {
		portalLoginEmailPage.saveAndContinue();

		portalLoginEmailPage.verifyErrorSummary(ERROR_MESSAGES.NO_EMAIL_ENTERED_SUMMARY, ERROR_MESSAGES.NO_EMAIL_ENTERED);
		portalLoginEmailPage.verifyFieldErrorContains(ERROR_MESSAGES.NO_EMAIL_ENTERED);
	});

	it('shows an error for an invalid email format', { tags: ['regression'] }, () => {
		portalLoginEmailPage.enterEmail('invalid-email');
		portalLoginEmailPage.saveAndContinue();

		portalLoginEmailPage.verifyErrorSummary(
			ERROR_MESSAGES.INVALID_EMAIL_FORMAT_SUMMARY,
			ERROR_MESSAGES.INVALID_EMAIL_FORMAT
		);
		portalLoginEmailPage.verifyFieldErrorContains(ERROR_MESSAGES.INVALID_EMAIL_FORMAT);
	});

	it('shows an error for an unrecognised email', { tags: ['regression'] }, () => {
		portalLoginEmailPage.enterEmail('unknown@example.com');
		portalLoginEmailPage.saveAndContinue();

		portalLoginEmailPage.verifyErrorSummary(
			ERROR_MESSAGES.UNRECOGNISED_EMAIL_SUMMARY,
			ERROR_MESSAGES.UNRECOGNISED_EMAIL
		);
		portalLoginEmailPage.verifyFieldErrorContains(ERROR_MESSAGES.UNRECOGNISED_EMAIL);
	});
});
