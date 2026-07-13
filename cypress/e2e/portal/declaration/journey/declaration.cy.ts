import { completePortalLogin, startPortalOtpLogin } from '../../../../flows/portal/login-flow.ts';
import { portalDeclarationPage } from '../../../../page-objects/portal/declaration/declaration-page.ts';

describe('Declaration page journeys', () => {
	beforeEach(() => {
		cy.setCookie('cookie_consent', 'accept');
		startPortalOtpLogin();
		completePortalLogin();
	});

	it('Navigates to gateway 2 application when back link is clicked', { tags: ['smoke'] }, () => {
		portalDeclarationPage.visit('p');
		portalDeclarationPage.verifyLoaded();
		portalDeclarationPage.verifyHeading('Review declaration');

		portalDeclarationPage.backLink.click();
		cy.url().should('include', '/p/gateway-2-application');
	});

	it(
		'Navigates to application complete page when both checkboxes are checked and confirm and submit is clicked',
		{ tags: ['smoke'] },
		() => {
			portalDeclarationPage.visit('p');
			portalDeclarationPage.verifyLoaded();
			portalDeclarationPage.verifyHeading('Review declaration');

			portalDeclarationPage.confirmInformationCheckbox.click();
			portalDeclarationPage.privacyNoteCheckbox.click();
			portalDeclarationPage.confirmAndSubmitButton.click();
			cy.url().should('include', '/p/gateway-2-application/application-complete');
		}
	);
});
