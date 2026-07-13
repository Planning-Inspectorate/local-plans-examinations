import { portalDeclarationPage } from '../../../../page-objects/portal/declaration/declaration-page.ts';
import { completePortalLogin, startPortalOtpLogin } from '../../../../flows/portal/login-flow.ts';
import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';

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
			'There is a problem',
			'You must confirm both declarations before you can submit your application.'
		);
		portalDeclarationPage.verifyFieldErrorContains(
			'You must confirm both declarations before you can submit your application.'
		);
	});

	it('Shows an error when not all checkboxes have been selected', { tags: ['regression'] }, () => {
		openDeclarationPage();
		portalDeclarationPage.confirmInformationCheckbox.click();
		portalDeclarationPage.confirmAndSubmitButton.click();

		portalDeclarationPage.verifyErrorSummary(
			'There is a problem',
			'You must confirm both declarations before you can submit your application.'
		);
		portalDeclarationPage.verifyFieldErrorContains(
			'You must confirm both declarations before you can submit your application.'
		);
		portalDeclarationPage.confirmInformationCheckbox.click();
		portalDeclarationPage.confirmInformationCheckbox.should('not.be.checked');

		portalDeclarationPage.privacyNoteCheckbox.click();
		portalDeclarationPage.confirmAndSubmitButton.click();

		portalDeclarationPage.verifyErrorSummary(
			'There is a problem',
			'You must confirm both declarations before you can submit your application.'
		);
		portalDeclarationPage.verifyFieldErrorContains(
			'You must confirm both declarations before you can submit your application.'
		);
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
