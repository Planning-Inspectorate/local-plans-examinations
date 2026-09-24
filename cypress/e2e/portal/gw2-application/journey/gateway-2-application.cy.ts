import { portalLogin } from '../../../../flows/portal/login-flow.ts';
import { cleanupPreparedPlanDetails, preparePlanDetails } from '../../../../flows/portal/plan-flow.ts';
import { myPlansPage } from '../../../../page-objects/portal/my-plans-page.ts';
import { planDetailsPage } from '../../../../page-objects/portal/plan-details/plan-details-page.ts';
import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';
import { gateway2ApplicationPage } from '../../../../page-objects/portal/gw2-application/gateway-2-application-page.ts';

describe('Gateway 2 application page journeys', () => {
	let planDetails: PlanDetailsFixture;

	beforeEach(() => {
		preparePlanDetails().then((plan) => {
			planDetails = plan;
		});
		portalLogin();
	});
	afterEach(cleanupPreparedPlanDetails);

	it('Navigates to Plan Details page when the Back link is clicked', { tags: ['smoke'] }, () => {
		myPlansPage.verifyLoaded();
		myPlansPage.openPlan(planDetails.reference);
		planDetailsPage.verifyLoaded();
		planDetailsPage.gateway2Link.click();
		gateway2ApplicationPage.verifyLoaded();
		gateway2ApplicationPage.goBack();
		planDetailsPage.verifyPathForPlan(planDetails.urlReference);
	});

	it(
		'Navigates to Plan Details page when the Save and come back later link is clicked',
		{ tags: ['smoke', 'environment-smoke'] },
		() => {
			myPlansPage.verifyLoaded();
			myPlansPage.openPlan(planDetails.reference);
			planDetailsPage.verifyLoaded();
			planDetailsPage.gateway2Link.click();
			gateway2ApplicationPage.verifyLoaded();
			gateway2ApplicationPage.saveAndComeBackLink.click();
			planDetailsPage.verifyPathForPlan(planDetails.urlReference);
		}
	);

	it('Navigates to My Plans page when Submit development plans is clicked', { tags: ['smoke'] }, () => {
		myPlansPage.verifyLoaded();
		myPlansPage.openPlan(planDetails.reference);
		planDetailsPage.verifyLoaded();
		planDetailsPage.gateway2Link.click();
		gateway2ApplicationPage.verifyLoaded();
		gateway2ApplicationPage.openServiceNavigationItem('Submit development plans');
		myPlansPage.verifyLoaded();
	});
});
