import { applicationCompletePage } from '../../../../page-objects/portal/gw2-application/application-complete-page.ts';
import { completePortalLogin, startPortalOtpLogin } from '../../../../flows/portal/login-flow.ts';
import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');

describe('Application Complete page content', () => {
	beforeEach(() => {
		cy.setCookie('cookie_consent', 'accept');
		startPortalOtpLogin();
		completePortalLogin();
	});

	it('Verifying page content for the application complete page', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			applicationCompletePage.visit(plan.urlReference);
			applicationCompletePage.verifyLoaded();
			applicationCompletePage.verifyServiceNavigation('Guidance', 'Account settings', 'Manage users');
			applicationCompletePage.verifyMainContains(
				'Application complete',
				'What happens next',
				`We've sent your application to the Planning Inspectorate. They will check that your application is complete and that they have all the information required to proceed to the next stage of the plan.`,
				'They will contact you if any further information is required.',
				'You can return to your plan to check the status of your submission at any time.'
			);
			applicationCompletePage.returnToYourPlanLink(plan.urlReference).should('be.visible');
		});
	});
});
