import { portalLogin } from '../../../../flows/portal/login-flow.ts';
import { portalLandingPage } from '../../../../page-objects/portal/landing-page.ts';
import { planDetailsPage } from '../../../../page-objects/portal/plan-details/plan-details-page.ts';
import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';
import { gateway2ApplicationPage } from '../../../../page-objects/portal/gw2-application/gateway-2-application-page.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');

describe('Gateway 2 application page journeys', () => {
	beforeEach(() => {
		portalLogin();
	});

	it('Navigates to Plan Details page when the Back link is clicked', { tags: ['smoke'] }, () => {
		loadPlanDetails().then((plan) => {
			portalLandingPage.verifyLoaded();
			portalLandingPage.openPlan(plan.reference);
			planDetailsPage.verifyLoaded();
			planDetailsPage.gateway2Link.click();
			gateway2ApplicationPage.verifyLoaded();
			gateway2ApplicationPage.backLink.click();
			planDetailsPage.verifyPathForPlan(plan.urlReference);
		});
	});

	it('Navigates to Plan Details page when the Save and come back later link is clicked', { tags: ['smoke'] }, () => {
		loadPlanDetails().then((plan) => {
			portalLandingPage.verifyLoaded();
			portalLandingPage.openPlan(plan.reference);
			planDetailsPage.verifyLoaded();
			planDetailsPage.gateway2Link.click();
			gateway2ApplicationPage.verifyLoaded();
			gateway2ApplicationPage.saveAndComeBackLink.click();
			planDetailsPage.verifyPathForPlan(plan.urlReference);
		});
	});
});
