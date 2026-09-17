import type { PlanDetailsFixture } from '../../fixtures/portal/types.ts';
import { myPlansPage } from '../../page-objects/portal/my-plans-page.ts';
import { planDetailsPage } from '../../page-objects/portal/plan-details/plan-details-page.ts';
import { gateway2ApplicationPage } from '../../page-objects/portal/gw2-application/gateway-2-application-page.ts';
import { isEnvironmentSmoke } from '../auth-flow.ts';

export const preparePlanDetails = () => {
	if (isEnvironmentSmoke()) {
		return cy.task('seedPortalSmokeCase') as Cypress.Chainable<PlanDetailsFixture>;
	}

	return cy.fixture<PlanDetailsFixture>('portal/plan-details.json');
};

export const openGateway2ApplicationPage = (plan: Pick<PlanDetailsFixture, 'reference'>) => {
	myPlansPage.verifyLoaded();
	myPlansPage.openPlan(plan.reference);
	planDetailsPage.verifyLoaded();
	planDetailsPage.gateway2Link.click();
	gateway2ApplicationPage.verifyLoaded();
};
