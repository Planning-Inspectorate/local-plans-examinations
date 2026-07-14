import { applicationCompletePage } from '../../../../page-objects/portal/gw2-application/application-complete-page.ts';
import { startPortalOtpLogin, completePortalLogin } from '../../../../flows/portal/login-flow.ts';
import { planDetailsPage } from 'cypress/page-objects/portal/plan-details/plan-details-page.ts';
import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');

describe('Application complete page journeys', () => {
	beforeEach(() => {
		cy.setCookie('cookie_consent', 'accept');
		startPortalOtpLogin();
		completePortalLogin();
	});

	it('Navigates to the plan details page', { tags: ['smoke'] }, () => {
		loadPlanDetails().then((plan) => {
			applicationCompletePage.visit(plan.urlReference);
			applicationCompletePage.verifyLoaded();

			applicationCompletePage.returnToYourPlanLink(plan.urlReference).click();
			planDetailsPage.verifyLoaded();
		});
	});
});
