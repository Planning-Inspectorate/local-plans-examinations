import { portalLogin } from '../../../../flows/portal/login-flow.ts';
import { gateway3ResubmissionPage } from '../../../../page-objects/portal/gw3-application/gateway-3-resubmission-page.ts';
import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';
import { ERROR_MESSAGES } from '../../../../constants/portal/error-messages.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');

describe('Gateway 3 resubmission validation tests', () => {
	beforeEach(() => {
		portalLogin();
		cy.task('seedGateway3Resubmission');
	});

	after(() => cy.task('clearDb'));

	it('Shows error message when no document is uploaded to the resubmission page', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			gateway3ResubmissionPage.visit(plan.urlReference);
			gateway3ResubmissionPage.verifyLoaded();
			gateway3ResubmissionPage.submitButton.click();
			gateway3ResubmissionPage.verifyErrorSummary(
				ERROR_MESSAGES.THERE_IS_A_PROBLEM,
				ERROR_MESSAGES.ADD_NEW_OR_UPDATED_DOCUMENTS
			);
		});
	});
});
