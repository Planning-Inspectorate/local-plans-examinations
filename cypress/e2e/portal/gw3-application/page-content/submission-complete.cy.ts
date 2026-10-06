import { gateway3SubmissionCompletePage } from '../../../../page-objects/portal/gw3-application/gateway-3-submission-complete-page.ts';
import { gateway3DeclarationPage } from '../../../../page-objects/portal/gw3-application/declaration-page.ts';
import { portalLogin } from '../../../../flows/portal/login-flow.ts';
import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';
import { openSeededGateway3DeclarationPage } from '../../../../flows/portal/gateway-3-submission-flow.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');

describe('Gatway 3 submission complete page content', () => {
	beforeEach(() => {
		portalLogin();
		loadPlanDetails().then((plan) => {
			openSeededGateway3DeclarationPage(plan);
			gateway3DeclarationPage.confirmSubmissionButton.click();
		});
	});

	it('Verifying page content for the Gateway 3 submission complete page', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			gateway3SubmissionCompletePage.verifyLoaded();
			gateway3SubmissionCompletePage.verifyServiceNavigation('Guidance', 'Sign out');
			gateway3SubmissionCompletePage.verifyMainContains(
				'Gateway 3 submission complete',
				'We have sent you a confirmation email',
				'What happens next',
				'The Planning Inspectorate will check that your submission is complete and your plan is ready for the next round of assessment',
				'They will contact you if any further information is required',
				'At any point you can',
				'If you need to adjust your submission,'
			);
			gateway3SubmissionCompletePage.checkSubmissionStatusLink(plan.urlReference).should('be.visible');
			gateway3SubmissionCompletePage.verifyGetInTouchLink();
		});
	});
});
