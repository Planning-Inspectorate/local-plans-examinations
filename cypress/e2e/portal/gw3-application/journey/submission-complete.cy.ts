import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';
import { portalLogin } from '../../../../flows/portal/login-flow.ts';
import { gateway3SubmissionCompletePage } from '../../../../page-objects/portal/gw3-application/gateway-3-submission-complete-page.ts';
import { gateway3DeclarationPage } from '../../../../page-objects/portal/gw3-application/declaration-page.ts';
import { openSeededGateway3DeclarationPage } from '../../../../flows/portal/gateway-3-submission-flow.ts';
import { planDetailsPage } from 'cypress/page-objects/portal/plan-details/plan-details-page.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');
const today = new Date();
const todayDisplay = today.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

describe('Gateway 3 application complete page journeys', () => {
	beforeEach(() => {
		cy.task('clearDb');
		portalLogin();
		loadPlanDetails().then((plan) => {
			openSeededGateway3DeclarationPage(plan);
		});
	});

	it('Navigates to the plan details page', { tags: ['smoke'] }, () => {
		loadPlanDetails().then((plan) => {
			gateway3DeclarationPage.confirmSubmissionButton.click();

			gateway3SubmissionCompletePage.verifyLoaded();
			gateway3SubmissionCompletePage.checkSubmissionStatusLink(plan.urlReference).click();

			planDetailsPage.verifyLoaded();
			planDetailsPage.verifyProgressRow('Gateway 3 - readiness check', `Submitted: ${todayDisplay}`, 'Under review');
		});
	});
});
