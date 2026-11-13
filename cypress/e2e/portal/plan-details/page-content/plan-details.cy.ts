import { portalLogin, THIRD_TEST_EMAIL } from '../../../../flows/portal/login-flow.ts';
import type { PlanDetailsFixture, Gateway2ReportIssuedFixture } from '../../../../fixtures/portal/types.ts';
import { myPlansPage } from '../../../../page-objects/portal/my-plans-page.ts';
import { planDetailsPage } from '../../../../page-objects/portal/plan-details/plan-details-page.ts';
import { gateway3ApplicationPage } from '../../../../page-objects/portal/gw3-application/gateway-3-application-page.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');

describe('Plan details page content', () => {
	beforeEach(() => cy.task('clearDb'));

	after(() => cy.task('clearDb'));

	it('shows the plan title, reference and metadata', { tags: ['regression'] }, () => {
		portalLogin();
		loadPlanDetails().then((plan) => {
			myPlansPage.openPlan(plan.reference);
			planDetailsPage.verifyLoaded();
			planDetailsPage.verifyServiceNavigation('Guidance', 'Sign out');
			planDetailsPage.verifyBackLink('/manage-local-plans/your-plans');
			planDetailsPage.verifyHeading(plan.title);
			planDetailsPage.verifyMetadataValue('Reference', plan.reference);

			planDetailsPage.verifyPlanningAuthorities(plan.leadLpa, plan.linkedLpa);
		});
	});

	it('shows single-LPA plan details', { tags: ['regression'] }, () => {
		portalLogin(undefined, { singleLpa: true });
		loadPlanDetails().then((plan) => {
			myPlansPage.openPlan(plan.reference);
			planDetailsPage.verifyLoaded();
			planDetailsPage.verifyBackLink();
			planDetailsPage.verifyHeading(plan.title);
			planDetailsPage.verifyMetadataValue('Reference', plan.reference);
			planDetailsPage.verifyPlanningAuthorities(plan.leadLpa);
		});
	});

	it('shows three progress rows and uses the Gateway 2 task link', { tags: ['regression'] }, () => {
		portalLogin();
		loadPlanDetails().then((plan) => {
			myPlansPage.openPlan(plan.reference);
			planDetailsPage.verifyLoaded();
			planDetailsPage.actionButton.should('not.exist');
			planDetailsPage.gateway2Link
				.should('be.visible')
				.and('have.attr', 'href', `/manage-local-plans/${plan.urlReference}/gateway-2-submission`);
			cy.contains('h2', 'Assessment information').should('not.exist');
			cy.get('.govuk-tabs').should('not.exist');
			planDetailsPage.verifyPlanProgressHeading();
			planDetailsPage.verifyPlanProgressRowsInOrder('Gateway 2', 'Gateway 3', 'Examination');

			planDetailsPage.planProgress.should('not.contain.text', 'Gateway 1 - self-assessment');
			planDetailsPage.verifyProgressRow('Gateway 2', `Submission expected: ${plan.dates.gateway2}`, plan.readyToStart);
			planDetailsPage.verifyProgressRow('Gateway 3', `Submission expected: ${plan.dates.gateway3}`, 'Cannot start yet');
			planDetailsPage.verifyProgressRow(
				'Examination',
				`Submission expected: ${plan.dates.examination}`,
				'Cannot start yet'
			);
		});
	});
});

const loadReportIssuedPlan = () => cy.fixture<Gateway2ReportIssuedFixture>('portal/gateway-2-report-issued.json');

describe('Plan details page content after GW2 report issued in BO', () => {
	beforeEach(() => {
		cy.task('clearDb');
		portalLogin(THIRD_TEST_EMAIL);
		loadReportIssuedPlan().then((plan) => {
			myPlansPage.openPlan(plan.reference);
		});
	});

	after(() => cy.task('clearDb'));

	it('Shows Gateway 2 as completed and Gateway 3 as ready to start', { tags: ['regression'] }, () => {
		loadReportIssuedPlan().then((plan) => {
			planDetailsPage.verifyLoaded();
			planDetailsPage.verifyMetadataValue('Reference', plan.reference);
			planDetailsPage.verifyProgressRow('Gateway 2', `Submission expected: ${plan.dates.gateway2}`, 'Completed');
			planDetailsPage.verifyProgressRow('Gateway 3', `Submission expected: ${plan.dates.gateway3}`, plan.readyToStart);
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
