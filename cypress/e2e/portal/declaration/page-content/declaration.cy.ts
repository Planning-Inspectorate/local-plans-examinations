import { portalDeclarationPage } from '../../../../page-objects/portal/declaration/declaration-page.ts';
import { completePortalLogin, startPortalOtpLogin } from '../../../../flows/portal/login-flow.ts';
import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');

describe('Declaration page content', () => {
	beforeEach(() => {
		cy.setCookie('cookie_consent', 'accept');
		startPortalOtpLogin();
		completePortalLogin();
	});

	it('Verifying page content for the declaration page', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			portalDeclarationPage.visit(plan.urlReference);
			portalDeclarationPage.verifyLoaded();
			portalDeclarationPage.verifyServiceNavigation('Guidance', 'Account settings', 'Manage users');
			portalDeclarationPage.verifyBackLink('/manage-local-plans/p/gateway-2-application');
			portalDeclarationPage.verifyMainContains(
				'Your application',
				'Your declaration will be linked to the email address you used to sign in. This helps us identify who submitted the application.',
				'By submitting this application, I confirm that:',
				'To the best of your knowledge, the information given in this application and enclosed maps, plans and other documents are true.',
				`I have read and agree to The Planning Inspectorate's privacy note`
			);
			portalDeclarationPage.verifyPrivacyNoteLink();
			portalDeclarationPage.verifyConfirmAndSubmitButton();
		});
	});
});
