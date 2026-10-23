import { applicationCompletePage } from '../../../../page-objects/portal/gw2-application/application-complete-page.ts';
import { portalLogin, TEST_EMAIL } from '../../../../flows/portal/login-flow.ts';
import { planDetailsPage } from '../../../../page-objects/portal/plan-details/plan-details-page.ts';
import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';
import { myPlansPage } from '../../../../page-objects/portal/my-plans-page.ts';
import { gateway2ApplicationPage } from '../../../../page-objects/portal/gw2-application/gateway-2-application-page.ts';
import {
	localPlanTimetablePage,
	gateway2CoverLetterPage
} from '../../../../page-objects/portal/gw2-application/gateway-2-uploads.page.ts';
import { submitGateway2Application } from '../../../../flows/portal/gateway-2-submission-flow.ts';
import { gateway2SubmittedPlan } from '../../../../fixtures/portal/gateway-2-uploads.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');
const today = new Date();
const todayDisplay = today.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

describe('Application complete page journeys', () => {
	beforeEach(() => {
		portalLogin();
	});

	after(() => cy.task('clearDb'));

	it('Navigates to the plan details page', { tags: ['smoke'] }, () => {
		loadPlanDetails().then((plan) => {
			applicationCompletePage.visit(plan.urlReference);
			applicationCompletePage.verifyLoaded();

			applicationCompletePage.returnToYourPlanLink(plan.urlReference).click();
			planDetailsPage.verifyLoaded();
		});
	});

	it(
		'User navigates from sign in to application complete page while uploading a document for gateway 2',
		{ tags: ['regression'] },
		() => {
			loadPlanDetails().then((plan) => {
				submitGateway2Application(plan, [
					{ page: gateway2CoverLetterPage, fileNames: [gateway2SubmittedPlan.coveringLetter] },
					{ page: localPlanTimetablePage, fileNames: gateway2SubmittedPlan.timetableFiles }
				]);

				applicationCompletePage.returnToYourPlanLink(plan.urlReference).click();
				planDetailsPage.verifyLoaded();
				planDetailsPage.verifyProgressRow('Gateway 2 - advisory check', `Submitted: ${todayDisplay}`, 'Under review');
				planDetailsPage.goBack();
				myPlansPage.verifyLoaded();
				myPlansPage.verifyTableRows(myPlansPage.myPlansTable, [
					[plan.reference, plan.leadLpa, plan.title, plan.currentStage, plan.status3]
				]);

				gateway2ApplicationPage.visit(plan.urlReference);
				gateway2ApplicationPage.verifySubmittedApplication(todayDisplay, TEST_EMAIL);
			});
		}
	);
});
