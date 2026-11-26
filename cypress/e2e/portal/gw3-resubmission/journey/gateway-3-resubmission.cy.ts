import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';
import { portalLogin } from '../../../../flows/portal/login-flow.ts';
import { planDetailsPage } from '../../../../page-objects/portal/plan-details/plan-details-page.ts';
import { gateway3ResubmissionPage } from '../../../../page-objects/portal/gw3-application/gateway-3-resubmission-page.ts';
import { gateway3ResubmissionSubmissionCompletePage } from '../../../../page-objects/portal/gw3-application/gateway-3-resubmission-submission-complete-page.ts';
import { gateway3ResubmissionDeclarationPage } from '../../../../page-objects/portal/gw3-application/gateway-3-resubmission-declaration-page.ts';
import { resubmissionDocumentsPage } from '../../../../page-objects/portal/gw3-application/gateway-3-uploads-page.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');

describe('Gateway 3 resubmission page journeys', () => {
	beforeEach(() => {
		portalLogin();
		// Declaration guard needs the original GW3 answers (required docs and examination website)
		cy.task('seedGateway3Submitted');
		cy.task('seedGateway3Resubmission');
	});

	after(() => cy.task('clearDb'));

	it('Navigates to Plan Details page when the Back link is clicked', { tags: ['smoke'] }, () => {
		loadPlanDetails().then((plan) => {
			gateway3ResubmissionPage.visit(plan.urlReference);
			gateway3ResubmissionPage.verifyLoaded();
			gateway3ResubmissionPage.goBack();
			planDetailsPage.verifyPathForPlan(plan.urlReference);
		});
	});

	it('Navigates to Plan Details page when the Save and come back later link is clicked', { tags: ['smoke'] }, () => {
		loadPlanDetails().then((plan) => {
			gateway3ResubmissionPage.visit(plan.urlReference);
			gateway3ResubmissionPage.verifyLoaded();
			gateway3ResubmissionPage.saveAndComeBackLink.click();
			planDetailsPage.verifyPathForPlan(plan.urlReference);
		});
	});

	it(
		'Navigates to the Submission completion page after the resubmission is completed',
		{ tags: ['regression'] },
		() => {
			loadPlanDetails().then((plan) => {
				planDetailsPage.visit(plan.urlReference);
				planDetailsPage.gateway3Link.should('be.visible').click();

				gateway3ResubmissionPage.verifyLoaded();
				gateway3ResubmissionPage.verifyPathForPlan(plan.urlReference);
				gateway3ResubmissionPage.clickAddLink(resubmissionDocumentsPage.addCy);

				resubmissionDocumentsPage.verifyLoaded();
				resubmissionDocumentsPage.uploadAndVerifyFile('test-document.pdf');
				resubmissionDocumentsPage.saveAndReturn();

				gateway3ResubmissionPage.verifyLoaded();
				gateway3ResubmissionPage.verifyUploadedDocument('test-document.pdf');
				gateway3ResubmissionPage.submitButton.click();

				gateway3ResubmissionDeclarationPage.verifyLoaded();
				gateway3ResubmissionDeclarationPage.confirmSubmissionButton.click();

				gateway3ResubmissionSubmissionCompletePage.verifyLoaded();
			});
		}
	);
});
