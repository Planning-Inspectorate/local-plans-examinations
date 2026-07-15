import { portalDeclarationPage } from '../../../../page-objects/portal/gw2-application/declaration-page.ts';
import { completePortalLogin, startPortalOtpLogin } from '../../../../flows/portal/login-flow.ts';
import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';
import { ERROR_MESSAGES } from 'cypress/constants/portal/error-messages.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');

const openDeclarationPage = () => {
	loadPlanDetails().then((plan) => {
		portalDeclarationPage.visit(plan.urlReference);
	});
};

describe('Portal declaration page validation tests', () => {
	beforeEach(() => {
		cy.setCookie('cookie_consent', 'accept');
		startPortalOtpLogin();
		completePortalLogin();
	});

	it('Shows an error when no checkbox has been selected', { tags: ['regression'] }, () => {
		openDeclarationPage();
		portalDeclarationPage.confirmAndSubmitButton.click();

		portalDeclarationPage.verifyErrorSummary(
			ERROR_MESSAGES.THERE_IS_A_PROBLEM,
			ERROR_MESSAGES.DECLARATIONS_NOT_CONFIRMED
		);
		portalDeclarationPage.verifyFieldErrorContains(ERROR_MESSAGES.DECLARATIONS_NOT_CONFIRMED);
	});

	it('Shows an error when not all checkboxes have been selected', { tags: ['regression'] }, () => {
		openDeclarationPage();
		portalDeclarationPage.confirmInformationCheckbox.click();
		portalDeclarationPage.confirmAndSubmitButton.click();

		portalDeclarationPage.verifyErrorSummary(
			ERROR_MESSAGES.THERE_IS_A_PROBLEM,
			ERROR_MESSAGES.DECLARATIONS_NOT_CONFIRMED
		);
		portalDeclarationPage.verifyFieldErrorContains(ERROR_MESSAGES.DECLARATIONS_NOT_CONFIRMED);
		portalDeclarationPage.confirmInformationCheckbox.click();
		portalDeclarationPage.confirmInformationCheckbox.should('not.be.checked');

		portalDeclarationPage.privacyNoteCheckbox.click();
		portalDeclarationPage.confirmAndSubmitButton.click();

		portalDeclarationPage.verifyErrorSummary(
			ERROR_MESSAGES.THERE_IS_A_PROBLEM,
			ERROR_MESSAGES.DECLARATIONS_NOT_CONFIRMED
		);
		portalDeclarationPage.verifyFieldErrorContains(ERROR_MESSAGES.DECLARATIONS_NOT_CONFIRMED);
	});

	it(
		'Submission reference number is generated when not all checkboxes have been selected',
		{ tags: ['regression'] },
		() => {
			openDeclarationPage();
			portalDeclarationPage.confirmAndSubmitButton.click();
			portalDeclarationPage.submissionReference.invoke('text').should('match', /SUB-\d+-[A-Z0-9]+/);

			portalDeclarationPage.confirmInformationCheckbox.click();
			portalDeclarationPage.confirmAndSubmitButton.click();
			portalDeclarationPage.submissionReference.invoke('text').should('match', /SUB-\d+-[A-Z0-9]+/);

			portalDeclarationPage.confirmInformationCheckbox.click();
			portalDeclarationPage.confirmInformationCheckbox.should('not.be.checked');
			portalDeclarationPage.privacyNoteCheckbox.click();
			portalDeclarationPage.confirmAndSubmitButton.click();
			portalDeclarationPage.submissionReference.invoke('text').should('match', /SUB-\d+-[A-Z0-9]+/);
		}
	);
});
