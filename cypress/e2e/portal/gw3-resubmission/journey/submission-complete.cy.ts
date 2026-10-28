import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';
import { portalLogin } from '../../../../flows/portal/login-flow.ts';
import { gateway3ResubmissionSubmissionCompletePage } from '../../../../page-objects/portal/gw3-application/gateway-3-resubmission-submission-complete-page.ts';
import { gateway3ResubmissionDeclarationPage } from '../../../../page-objects/portal/gw3-application/gateway-3-resubmission-declaration-page.ts';
import { openSeededResubmissionDeclarationPage } from '../../../../flows/portal/gateway-3-resubmission-flow.ts';
import { planDetailsPage } from 'cypress/page-objects/portal/plan-details/plan-details-page.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');
const today = new Date();
const todayDisplay = today.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

describe('Gateway 3 resubmission application complete page journeys', () => {
	beforeEach(() => {
		cy.task('clearDb');
		portalLogin();
		loadPlanDetails().then((plan) => {
			openSeededResubmissionDeclarationPage(plan.urlReference);
		});
	});

	afterEach(() => {
		cy.task('clearDb');
	});

	it('Navigates to the plan details page after the resubmission is complete', { tags: ['smoke'] }, () => {
		loadPlanDetails().then((plan) => {
			gateway3ResubmissionDeclarationPage.confirmSubmissionButton.click();

			gateway3ResubmissionSubmissionCompletePage.verifyLoaded();
			gateway3ResubmissionSubmissionCompletePage.checkSubmissionStatusLink(plan.urlReference).click();

			planDetailsPage.verifyLoaded();
			planDetailsPage.verifyProgressRow('Gateway 3 - readiness check', `Submitted: ${todayDisplay}`, 'Under review');
		});
	});
});
