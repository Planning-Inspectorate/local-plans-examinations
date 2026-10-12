import { portalLogin } from '../../../../flows/portal/login-flow.ts';
import { planDetailsPage } from '../../../../page-objects/portal/plan-details/plan-details-page.ts';
import { myPlansPage } from '../../../../page-objects/portal/my-plans-page.ts';
import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');
const today = new Date();
const todayDisplay = today.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

describe('Plan details page content for gateway 3', () => {
	beforeEach(() => {
		portalLogin();
		cy.task('seedGateway3Submitted');
		loadPlanDetails().then((plan) => {
			myPlansPage.openPlan(plan.reference);
		});
	});

	after(() => cy.task('clearDb'));

	it('Shows the page content after gateway 3 is submitted', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			planDetailsPage.verifyLoaded();
			planDetailsPage.verifyMetadataValue('Current stage', plan.currentStage2, plan.status3);
			planDetailsPage.verifyProgressRow('Gateway 3 - readiness check', `Submitted: ${todayDisplay}`, plan.status3);
		});
	});
});
