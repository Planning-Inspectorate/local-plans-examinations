import { portalLogin } from '../../../../flows/portal/login-flow.ts';
import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';
import { portalLandingPage } from '../../../../page-objects/portal/landing-page.ts';
import { planDetailsPage } from '../../../../page-objects/portal/plan-details/plan-details-page.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');

describe('Plan details journey', () => {
	beforeEach(() => {
		portalLogin();
	});

	it('opens from My plans and returns using the back link', { tags: ['smoke'] }, () => {
		loadPlanDetails().then((plan) => {
			portalLandingPage.verifyLoaded();
			portalLandingPage.openPlan(plan.reference);
			planDetailsPage.verifyLoaded();

			planDetailsPage.backLink.click();

			portalLandingPage.verifyLoaded();
			portalLandingPage.verifyHeading('My plans');
		});
	});
});
