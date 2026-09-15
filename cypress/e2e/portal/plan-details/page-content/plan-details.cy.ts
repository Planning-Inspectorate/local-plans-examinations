import { portalLogin } from '../../../../flows/portal/login-flow.ts';
import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';
import { myPlansPage } from '../../../../page-objects/portal/my-plans-page.ts';
import { planDetailsPage } from '../../../../page-objects/portal/plan-details/plan-details-page.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');

describe('Plan details page content', () => {
	beforeEach(() => {
		portalLogin();
		loadPlanDetails().then((plan) => {
			myPlansPage.openPlan(plan.reference);
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
			planDetailsPage.verifyActionButton(
				'Start Gateway 2 submission',
				`/manage-local-plans/${plan.urlReference}/gateway-2-submission/application-declaration`
			);
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

	it(
		'shows Gateway 2 completed and Gateway 3 ready to start when the BO Gateway 2 report has been uploaded',
		{ tags: ['regression'] },
		() => {
			loadPlanDetails().then((plan) => {
				cy.task('seedGateway2Report');
				cy.visit(planDetailsPage.pathFor(plan.urlReference));

				planDetailsPage.verifyLoaded();
				planDetailsPage.verifyMetadataValue('Current stage', 'Gateway 3', 'Ready to start');
				planDetailsPage.verifyProgressRow('Gateway 2 - advisory check', 'Completed: 2 September 2026', 'Completed');
				planDetailsPage.verifyProgressRow(
					'Gateway 3 - readiness check',
					`Target date: ${plan.dates.gateway3}`,
					'Ready to start'
				);
				planDetailsPage.verifyProgressRowLink(
					'Gateway 3 - readiness check',
					`/manage-local-plans/${plan.urlReference}/gateway-3-submission`
				);
			});
		}
	);
});
