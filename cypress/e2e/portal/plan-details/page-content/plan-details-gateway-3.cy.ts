import { portalLogin } from '../../../../flows/portal/login-flow.ts';
import { planDetailsPage } from '../../../../page-objects/portal/plan-details/plan-details-page.ts';
import { myPlansPage } from '../../../../page-objects/portal/my-plans-page.ts';
import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');

describe('Plan details page content for gateway 3', () => {
	beforeEach(() => {
		portalLogin();
	});

	after(() => cy.task('clearDb'));

	it('Shows the page content after gateway 3 is submitted', { tags: ['regression'] }, () => {
		cy.task('seedGateway3Submitted');
		loadPlanDetails().then((plan) => {
			myPlansPage.openPlan(plan.reference);
			planDetailsPage.verifyLoaded();
			planDetailsPage.verifyMetadataValue('Reference', plan.reference);
			planDetailsPage.verifyProgressRow('Gateway 3', `Submission expected: ${plan.dates.gateway3}`, plan.status3);
		});
	});

	it('Shows the page content after gateway 3 resubmission is requested', { tags: ['regression'] }, () => {
		cy.task('seedGateway3Resubmission');
		loadPlanDetails().then((plan) => {
			myPlansPage.openPlan(plan.reference);
			planDetailsPage.verifyLoaded();
			planDetailsPage.verifyMetadataValue('Reference', plan.reference);
			planDetailsPage.verifyProgressRow('Gateway 3', `Submission expected: ${plan.dates.gateway3}`, plan.status4);
		});
	});
});
