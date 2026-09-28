import { portalLogin } from '../../../../flows/portal/login-flow.ts';
import { cleanupPreparedPlanDetails, preparePlanDetails } from '../../../../flows/portal/plan-flow.ts';
import { myPlansPage } from '../../../../page-objects/portal/my-plans-page.ts';
import { planDetailsPage } from '../../../../page-objects/portal/plan-details/plan-details-page.ts';
import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';
import { gateway2ApplicationPage } from '../../../../page-objects/portal/gw2-application/gateway-2-application-page.ts';
import { openGateway2DocumentUploadPage } from '../../../../flows/portal/gateway-2-upload-flow.ts';
import { gateway2CoverLetterPage } from '../../../../page-objects/portal/gw2-application/gateway-2-uploads.page.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');

describe('Gateway 2 application page journeys', () => {
	let planDetails: PlanDetailsFixture;

	beforeEach(() => {
		preparePlanDetails().then((plan) => {
			planDetails = plan;
		});
		portalLogin();
	});
	afterEach(cleanupPreparedPlanDetails);
	after(() => cy.task('clearDb'));

	it('Navigates to Plan Details page when the Back link is clicked', { tags: ['smoke'] }, () => {
		myPlansPage.verifyLoaded();
		myPlansPage.openPlan(planDetails.reference);
		planDetailsPage.verifyLoaded();
		planDetailsPage.gateway2Link.click();
		gateway2ApplicationPage.verifyLoaded();
		gateway2ApplicationPage.goBack();
		planDetailsPage.verifyPathForPlan(planDetails.urlReference);
	});

	it(
		'Navigates to Plan Details page when the Save and come back later link is clicked',
		{ tags: ['smoke', 'environment-smoke'] },
		() => {
			myPlansPage.verifyLoaded();
			myPlansPage.openPlan(planDetails.reference);
			planDetailsPage.verifyLoaded();
			planDetailsPage.gateway2Link.click();
			gateway2ApplicationPage.verifyLoaded();
			gateway2ApplicationPage.saveAndComeBackLink.click();
			planDetailsPage.verifyPathForPlan(planDetails.urlReference);
		}
	);

	it('Navigates to My Plans page when Submit development plans is clicked', { tags: ['smoke'] }, () => {
		myPlansPage.verifyLoaded();
		myPlansPage.openPlan(planDetails.reference);
		planDetailsPage.verifyLoaded();
		planDetailsPage.gateway2Link.click();
		gateway2ApplicationPage.verifyLoaded();
		gateway2ApplicationPage.openServiceNavigationItem('Submit development plans');
		myPlansPage.verifyLoaded();
	});

	it('Shows Gatway 2 status as in progress when a document is uploaded', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			const page = gateway2CoverLetterPage;
			openGateway2DocumentUploadPage(planDetails, page);
			page.dragAndDropAndVerifyFile('test-document.pdf');
			page.saveAndReturn();
			gateway2ApplicationPage.saveAndComeBackLink.click();
			planDetailsPage.verifyProgressRow(
				'Gateway 2 - advisory check',
				`Target date: ${plan.dates.gateway2}`,
				plan.status2
			);
		});
	});
});
