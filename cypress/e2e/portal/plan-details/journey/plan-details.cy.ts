import { portalLogin } from '../../../../flows/portal/login-flow.ts';
import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';
import { myPlansPage } from '../../../../page-objects/portal/my-plans-page.ts';
import { planDetailsPage } from '../../../../page-objects/portal/plan-details/plan-details-page.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');

describe('Plan details journey', () => {
	beforeEach(() => {
		portalLogin();
	});

	it('opens from My plans and returns using the back link', { tags: ['smoke'] }, () => {
		loadPlanDetails().then((plan) => {
			myPlansPage.verifyLoaded();
			myPlansPage.openPlan(plan.reference);
			planDetailsPage.verifyLoaded();

			planDetailsPage.goBack();

			myPlansPage.verifyLoaded();
			myPlansPage.verifyHeading('My plans');
		});
	});
});
