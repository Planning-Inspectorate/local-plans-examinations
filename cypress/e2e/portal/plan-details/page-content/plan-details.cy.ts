import { completePortalLogin, startPortalOtpLogin } from '../../../../flows/portal/login-flow.ts';
import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';
import { portalLandingPage } from '../../../../page-objects/portal/landing-page.ts';
import { planDetailsPage } from '../../../../page-objects/portal/plan-details/plan-details-page.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');

describe('Plan details page content', () => {
	beforeEach(() => {
		cy.setCookie('cookie_consent', 'accept');
		startPortalOtpLogin();
		completePortalLogin();
		loadPlanDetails().then((plan) => {
			portalLandingPage.openPlan(plan.reference);
		});
	});

	it('shows the plan title, reference and metadata', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			planDetailsPage.verifyLoaded();
			planDetailsPage.verifyServiceNavigation('Guidance', 'Account settings', 'Manage users');
			planDetailsPage.verifyBackLink('/manage-local-plans/your-plans');
			planDetailsPage.verifyHeading(plan.title);
			planDetailsPage.verifyCaption(plan.reference);

			planDetailsPage.verifyMetadataValue('Current stage', plan.currentStage, plan.status);
			planDetailsPage.verifyMetadataValue('Local planning authority', plan.leadLpa);
			planDetailsPage.verifyMetadataValue('Linked local planning authorities', plan.linkedLpa);
		});
	});

	it('shows the Gateway 2 action and plan progress rows', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			planDetailsPage.verifyLoaded();
			planDetailsPage.verifyActionButton('Start Gateway 2 submission', `/applicationPage/${plan.urlReference}/1`);
			planDetailsPage.verifyPlanProgressHeading();
			planDetailsPage.verifyPlanProgressRowsInOrder(
				'Gateway 1 - self-assessment (opens in a new tab)',
				'Gateway 2 - advisory check',
				'Gateway 3 - readiness check',
				'Examination'
			);

			planDetailsPage.verifyProgressRow(
				'Gateway 1 - self-assessment (opens in a new tab)',
				`Completed outside this service on ${plan.dates.gateway1}`,
				'Completed'
			);
			planDetailsPage.verifyProgressRow(
				'Gateway 2 - advisory check',
				`Target date: ${plan.dates.gateway2}`,
				plan.status
			);
			planDetailsPage.verifyProgressRow(
				'Gateway 3 - readiness check',
				`Target date: ${plan.dates.gateway3}`,
				'Cannot start yet'
			);
			planDetailsPage.verifyProgressRow('Examination', `Target date: ${plan.dates.examination}`, 'Cannot start yet');
		});
	});
});
