import type { PlanDetailsFixture } from '../../fixtures/portal/types.ts';
import { myPlansPage } from '../../page-objects/portal/my-plans-page.ts';
import { planDetailsPage } from '../../page-objects/portal/plan-details/plan-details-page.ts';
import { gateway2ApplicationPage } from '../../page-objects/portal/gw2-application/gateway-2-application-page.ts';
import { isEnvironmentSmoke } from '../auth-flow.ts';

const smokeCaseReferenceKey = 'portalSmokeCaseReference';

export const preparePlanDetails = () => {
	if (isEnvironmentSmoke()) {
		return cy.task<PlanDetailsFixture>('seedPortalSmokeCase').then((plan) => {
			Cypress.env(smokeCaseReferenceKey, plan.reference);
			return plan;
		});
	}

	return cy.fixture<PlanDetailsFixture>('portal/plan-details.json');
};

export const cleanupPreparedPlanDetails = () => {
	if (!isEnvironmentSmoke()) {
		return;
	}

	const reference = Cypress.env(smokeCaseReferenceKey);
	if (reference) {
		cy.task('softDeleteCaseByReference', reference);
		Cypress.env(smokeCaseReferenceKey, null);
	}
};

export const openGateway2ApplicationPage = (plan: Pick<PlanDetailsFixture, 'reference'>) => {
	myPlansPage.verifyLoaded();
	myPlansPage.openPlan(plan.reference);
	planDetailsPage.verifyLoaded();
	planDetailsPage.gateway2Link.click();
	gateway2ApplicationPage.verifyLoaded();
};
