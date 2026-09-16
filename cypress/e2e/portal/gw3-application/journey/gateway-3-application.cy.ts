import { portalLogin } from '../../../../flows/portal/login-flow.ts';
import { planDetailsPage } from '../../../../page-objects/portal/plan-details/plan-details-page.ts';
import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';
import { gateway3ApplicationPage } from '../../../../page-objects/portal/gw3-application/gateway-3-application-page.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');

describe('Gateway 3 application page journeys', () => {
	beforeEach(() => {
		portalLogin();
	});

	// Coverage for navigating to the gateway 3 application page from the plan details page will be implemented in future tickets
	it('Navigates to Plan Details page when the Back link is clicked', { tags: ['smoke'] }, () => {
		loadPlanDetails().then((plan) => {
			gateway3ApplicationPage.visit(plan.urlReference);
			gateway3ApplicationPage.verifyLoaded();
			gateway3ApplicationPage.goBack();
			planDetailsPage.verifyPathForPlan(plan.urlReference);
		});
	});

	it('Navigates to Plan Details page when the Save and come back later link is clicked', { tags: ['smoke'] }, () => {
		loadPlanDetails().then((plan) => {
			gateway3ApplicationPage.visit(plan.urlReference);
			gateway3ApplicationPage.verifyLoaded();
			gateway3ApplicationPage.saveAndComeBackLink.click();
			planDetailsPage.verifyPathForPlan(plan.urlReference);
		});
	});
});
