import { portalLogin, THIRD_TEST_EMAIL } from '../../../../flows/portal/login-flow.ts';
import type { PlanDetailsFixture, Gateway2ReportIssuedFixture } from '../../../../fixtures/portal/types.ts';
import { myPlansPage } from '../../../../page-objects/portal/my-plans-page.ts';
import { planDetailsPage } from '../../../../page-objects/portal/plan-details/plan-details-page.ts';
import { gateway3ApplicationPage } from '../../../../page-objects/portal/gw3-application/gateway-3-application-page.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');

describe('Plan details page content', () => {
	beforeEach(() => {
		portalLogin();
		loadPlanDetails().then((plan) => {
			myPlansPage.openPlan(plan.reference);
		});
	});

	after(() => cy.task('clearDb'));

	it('shows the plan title, reference and metadata', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			planDetailsPage.verifyLoaded();
			planDetailsPage.verifyServiceNavigation('Guidance', 'Sign out');
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
});

const loadReportIssuedPlan = () => cy.fixture<Gateway2ReportIssuedFixture>('portal/gateway-2-report-issued.json');

describe('Plan details page content after GW2 report issued in BO', () => {
	beforeEach(() => {
		portalLogin(THIRD_TEST_EMAIL);
		loadReportIssuedPlan().then((plan) => {
			myPlansPage.openPlan(plan.reference);
		});
	});

	after(() => cy.task('clearDb'));

	it('Shows Gateway 2 as completed and Gateway 3 as ready to start', { tags: ['regression'] }, () => {
		loadReportIssuedPlan().then((plan) => {
			planDetailsPage.verifyLoaded();
			planDetailsPage.verifyMetadataValue('Current stage', plan.currentStage, plan.status);
			planDetailsPage.verifyProgressRow('Gateway 2 - advisory check', `Completed: ${plan.dates.gateway2}`, 'Completed');
			planDetailsPage.verifyProgressRow(
				'Gateway 3 - readiness check',
				`Target date: ${plan.dates.gateway3}`,
				plan.status
			);
		});
	});

	it('Opens Gateway 3 submission page from the Gateway 3 link', { tags: ['regression'] }, () => {
		loadReportIssuedPlan().then((plan) => {
			planDetailsPage.verifyLoaded();
			planDetailsPage.gateway3Link.should('be.visible').click();

			gateway3ApplicationPage.verifyLoaded();
			gateway3ApplicationPage.verifyPathForPlan(plan.urlReference);
		});
	});
});
