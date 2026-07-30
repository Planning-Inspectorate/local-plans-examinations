import type { PlanDetailsFixture } from '../../fixtures/portal/types.ts';
import { portalLandingPage } from '../../page-objects/portal/landing-page.ts';
import { planDetailsPage } from '../../page-objects/portal/plan-details/plan-details-page.ts';
import { gateway2ApplicationPage } from '../../page-objects/portal/gw2-application/gateway-2-application-page.ts';

export const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');

export const openGateway2ApplicationPage = (plan: PlanDetailsFixture) => {
	portalLandingPage.verifyLoaded();
	portalLandingPage.openPlan(plan.reference);
	planDetailsPage.verifyLoaded();
	planDetailsPage.gateway2Link.click();
	gateway2ApplicationPage.verifyLoaded();
};
