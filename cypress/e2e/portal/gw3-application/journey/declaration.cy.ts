import { portalLogin } from '../../../../flows/portal/login-flow.ts';
import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';
import { gateway3SubmissionCompletePage } from '../../../../page-objects/portal/gw3-application/gateway-3-submission-complete-page.ts';
import { gateway3DeclarationPage } from '../../../../page-objects/portal/gw3-application/declaration-page.ts';
import { gateway3ApplicationPage } from '../../../../page-objects/portal/gw3-application/gateway-3-application-page.ts';
import { openSeededGateway3DeclarationPage } from '../../../../flows/portal/gateway-3-submission-flow.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');

describe('Gateway 3 Submission page journeys', () => {
	beforeEach(() => {
		cy.task('clearDb');
		portalLogin();
		loadPlanDetails().then((plan) => {
			openSeededGateway3DeclarationPage(plan);
		});
	});

	afterEach(() => {
		cy.task('clearDb');
	});

	it('Navigates to gateway 3 submission when back link is clicked', { tags: ['smoke'] }, () => {
		loadPlanDetails().then((plan) => {
			gateway3DeclarationPage.verifyLoaded();

			gateway3DeclarationPage.goBack();
			gateway3ApplicationPage.verifyPathForPlan(plan.urlReference);
		});
	});

	it('Navigates to gateway 3 submission complete page when confirm submission is clicked', { tags: ['smoke'] }, () => {
		loadPlanDetails().then((plan) => {
			gateway3DeclarationPage.verifyLoaded();

			gateway3DeclarationPage.confirmSubmissionButton.click();
			gateway3SubmissionCompletePage.verifyPathForPlan(plan.urlReference);
		});
	});
});
