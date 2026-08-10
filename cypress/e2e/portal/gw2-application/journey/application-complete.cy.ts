import { applicationCompletePage } from '../../../../page-objects/portal/gw2-application/application-complete-page.ts';
import { portalLogin } from '../../../../flows/portal/login-flow.ts';
import { planDetailsPage } from '../../../../page-objects/portal/plan-details/plan-details-page.ts';
import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');

describe('Application complete page journeys', () => {
	beforeEach(() => {
		portalLogin();
	});

	it.skip('Navigates to the plan details page, SKIPPED until bug LP-802 is resolved', { tags: ['smoke'] }, () => {
		loadPlanDetails().then((plan) => {
			applicationCompletePage.visit(plan.urlReference);
			applicationCompletePage.verifyLoaded();

			applicationCompletePage.returnToYourPlanLink(plan.urlReference).click();
			planDetailsPage.verifyLoaded();
		});
	});
});
