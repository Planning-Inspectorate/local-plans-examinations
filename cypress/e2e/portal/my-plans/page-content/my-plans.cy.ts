import { portalLogin, THIRD_TEST_EMAIL } from '../../../../flows/portal/login-flow.ts';
import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';
import type { Gateway2ReportIssuedFixture } from '../../../../fixtures/portal/types.ts';
import { myPlansPage } from '../../../../page-objects/portal/my-plans-page.ts';
import { gateway2CoverLetterPage } from '../../../../page-objects/portal/gw2-application/gateway-2-uploads.page.ts';
import { openGateway2DocumentUploadPage } from '../../../../flows/portal/gateway-2-upload-flow.ts';
import { cleanupPreparedPlanDetails, preparePlanDetails } from '../../../../flows/portal/plan-flow.ts';
import { gateway2ApplicationPage } from '../../../../page-objects/portal/gw2-application/gateway-2-application-page.ts';
import { planDetailsPage } from '../../../../page-objects/portal/plan-details/plan-details-page.ts';
import { submitGateway2Application } from '../../../../flows/portal/gateway-2-submission-flow.ts';
import { applicationCompletePage } from '../../../../page-objects/portal/gw2-application/application-complete-page.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');

describe('My plans page content for gateway 2', () => {
	let planDetails: PlanDetailsFixture;

	beforeEach(() => {
		cy.task('clearDb');
		preparePlanDetails().then((plan) => {
			planDetails = plan;
		});
		portalLogin();
	});

	afterEach(cleanupPreparedPlanDetails);
	after(() => cy.task('clearDb'));

	it('Shows the details on the my plans page', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			myPlansPage.verifyServiceNavigation('Guidance', 'Sign out');
			myPlansPage.verifyLoaded();
			myPlansPage.verifyCaption(plan.leadLpa);
			myPlansPage.verifyTableHeaders(myPlansPage.myPlansTable, [
				'Reference number',
				'Lead local planning authority',
				'Plan title',
				'Current stage',
				'Status'
			]);
			myPlansPage.verifyTableRows(myPlansPage.myPlansTable, [
				[plan.reference, plan.leadLpa, plan.title, plan.currentStage, plan.status]
			]);
			myPlansPage.verifyYourPlanLink(plan.reference);
		});
	});

	it(
		'Shows Gatway 2 status as in progress on the my plans pages after document is uploaded',
		{ tags: ['regression'] },
		() => {
			loadPlanDetails().then((plan) => {
				const page = gateway2CoverLetterPage;
				openGateway2DocumentUploadPage(planDetails, page);
				page.dragAndDropAndVerifyFile('test-document.pdf');
				page.saveAndReturn();
				gateway2ApplicationPage.saveAndComeBackLink.click();
				planDetailsPage.backLink.click();
				myPlansPage.verifyTableRows(myPlansPage.myPlansTable, [
					[plan.reference, plan.leadLpa, plan.title, plan.currentStage, plan.status2]
				]);
			});
		}
	);

	it('Shows Gateway 2 status as under review after submission', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			submitGateway2Application(plan, [{ page: gateway2CoverLetterPage, fileNames: ['test-document.pdf'] }]);
			applicationCompletePage.returnToYourPlanLink(plan.urlReference).click();
			planDetailsPage.backLink.click();
			myPlansPage.verifyTableRows(myPlansPage.myPlansTable, [
				[plan.reference, plan.leadLpa, plan.title, plan.currentStage, 'Under review']
			]);
		});
	});
});

const loadReportIssuedPlan = () => cy.fixture<Gateway2ReportIssuedFixture>('portal/gateway-2-report-issued.json');

describe('My plans page content for gateway 3', () => {
	beforeEach(() => {
		portalLogin(THIRD_TEST_EMAIL);
	});

	after(() => cy.task('clearDb'));

	it('Shows gateway 3 as Ready to start on the my plans page', { tags: ['smoke'] }, () => {
		loadReportIssuedPlan().then((plan) => {
			myPlansPage.verifyLoaded();
			myPlansPage.verifyTableRows(myPlansPage.myPlansTable, [
				[plan.reference, plan.leadLpa, plan.title, plan.currentStage, 'Ready to start']
			]);
		});
	});
});
