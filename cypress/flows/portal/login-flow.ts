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

export const portalLogin = () => {
	cy.setCookie('cookie_consent', 'accept');
	startPortalOtpLogin();
	completePortalLogin();
};

export const manageToPortalLogin = () => {
	cy.task('seedCase');
	cy.task('seedOtp').then((otp) => {
		cy.origin(Cypress.env('portalBaseUrl'), { args: { email: TEST_EMAIL, otp: String(otp) } }, ({ email, otp }) => {
			cy.visit('/login');
			cy.setCookie('cookie_consent', 'accept');
			cy.get('[data-cy="email"]').clear().type(email);
			cy.get('[data-cy="button-save-and-continue"]').click();
			cy.get('[data-cy="otp"]').clear().type(otp);
			cy.get('[data-cy="button-save-and-continue"]').click();
		});
	});
};
