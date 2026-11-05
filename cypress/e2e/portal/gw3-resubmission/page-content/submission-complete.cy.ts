import { gateway3ResubmissionSubmissionCompletePage } from '../../../../page-objects/portal/gw3-application/gateway-3-resubmission-submission-complete-page.ts';
import { gateway3ResubmissionDeclarationPage } from '../../../../page-objects/portal/gw3-application/gateway-3-resubmission-declaration-page.ts';
import { portalLogin } from '../../../../flows/portal/login-flow.ts';
import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';
import { openSeededResubmissionDeclarationPage } from '../../../../flows/portal/gateway-3-resubmission-flow.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');

describe('Gatway 3 resubmission complete page content', () => {
	beforeEach(() => {
		cy.task('clearDb');
		portalLogin();
		loadPlanDetails().then((plan) => {
			openSeededResubmissionDeclarationPage(plan.urlReference);
			gateway3ResubmissionDeclarationPage.confirmSubmissionButton.click();
		});
	});

	it('Verifying page content for the Gateway 3 resubmission complete page', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			gateway3ResubmissionSubmissionCompletePage.verifyLoaded();
			gateway3ResubmissionSubmissionCompletePage.verifyServiceNavigation('Guidance', 'Sign out');
			gateway3ResubmissionSubmissionCompletePage.verifyMainContains(
				'Gateway 3 submission complete',
				`We've sent you a confirmation email`,
				'What happens next',
				'Your case officer will assign an assessor to your case',
				'The assessor will review your submission and let you know if any additional information is required',
				'At any point you can'
			);
			gateway3ResubmissionSubmissionCompletePage.checkSubmissionStatusLink(plan.urlReference).should('be.visible');
		});
	});
});
