import { portalLogin } from '../../../../flows/portal/login-flow.ts';
import { cleanupPreparedPlanDetails, preparePlanDetails } from '../../../../flows/portal/plan-flow.ts';
import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';
import { myPlansPage } from '../../../../page-objects/portal/my-plans-page.ts';
import { planDetailsPage } from '../../../../page-objects/portal/plan-details/plan-details-page.ts';

describe('Plan details journey', () => {
	let planDetails: PlanDetailsFixture;

	beforeEach(() => {
		preparePlanDetails().then((plan) => {
			planDetails = plan;
		});
		portalLogin();
	});
	afterEach(cleanupPreparedPlanDetails);

	it('opens from My plans and returns using the back link', { tags: ['smoke', 'environment-smoke'] }, () => {
		myPlansPage.verifyLoaded();
		myPlansPage.openPlan(planDetails.reference);
		planDetailsPage.verifyLoaded();

		planDetailsPage.goBack();

		myPlansPage.verifyLoaded();
		myPlansPage.verifyHeading('My plans');
	});

	it('opens Gateway 2 from the progress row', { tags: ['regression'] }, () => {
		myPlansPage.openPlan(planDetails.reference);
		planDetailsPage.verifyLoaded();
		planDetailsPage.actionButton.should('not.exist');
		planDetailsPage.gateway2Link.should('be.visible').click();
		cy.location('pathname').should('equal', `/manage-local-plans/${planDetails.urlReference}/gateway-2-submission`);
		cy.get('h1').should('contain.text', 'Gateway 2');
	});

	it('Navigates to My Plans page when Submit development plans is clicked', { tags: ['smoke'] }, () => {
		myPlansPage.verifyLoaded();
		myPlansPage.openPlan(planDetails.reference);
		planDetailsPage.verifyLoaded();

		planDetailsPage.openServiceNavigationItem('Submit development plans');
		myPlansPage.verifyLoaded();
	});
});
