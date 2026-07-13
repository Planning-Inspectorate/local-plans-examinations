import { portalDeclarationPage } from '../../../../page-objects/portal/declaration/declaration-page.ts';
import { completePortalLogin, startPortalOtpLogin } from '../../../../flows/portal/login-flow.ts';

describe('Declaration page content', () => {
	beforeEach(() => {
		cy.setCookie('cookie_consent', 'accept');
		startPortalOtpLogin();
		completePortalLogin();
	});

	it('Verifying page content for the declaration page', { tags: ['regression'] }, () => {
		portalDeclarationPage.visit('p');
		portalDeclarationPage.verifyLoaded();
		portalDeclarationPage.verifyServiceNavigation('Guidance', 'Account settings', 'Manage users');
		portalDeclarationPage.verifyBackLink('/manage-local-plans/p/gateway-2-application');
		portalDeclarationPage.verifyHeading('Review declaration');
		portalDeclarationPage.verifyCaption('Your application');
		portalDeclarationPage.verifyInsetText(
			'Your declaration will be linked to the email address you used to sign in. This helps us identify who submitted the application.'
		);
		portalDeclarationPage.verifyBodyText('By submitting this application, I confirm that:');
		portalDeclarationPage.verifyConfirmInformationCheckbox(
			'To the best of your knowledge, the information given in this application and enclosed maps, plans and other documents are true.'
		);
		portalDeclarationPage.verifyPrivacyNoteCheckbox(
			`I have read and agree to The Planning Inspectorate's privacy note`
		);
		portalDeclarationPage.verifyPrivacyNoteLink();
		portalDeclarationPage.verifyConfirmAndSubmitButton();
	});
});
