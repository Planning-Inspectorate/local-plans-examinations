import { portalLogin } from '../../../../flows/portal/login-flow.ts';
import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';
import { gateway3ResubmissionSubmissionCompletePage } from '../../../../page-objects/portal/gw3-application/gateway-3-resubmission-submission-complete-page.ts';
import { gateway3ResubmissionDeclarationPage } from '../../../../page-objects/portal/gw3-application/gateway-3-resubmission-declaration-page.ts';
import { gateway3ResubmissionPage } from '../../../../page-objects/portal/gw3-application/gateway-3-resubmission-page.ts';
import { openSeededResubmissionDeclarationPage } from '../../../../flows/portal/gateway-3-resubmission-flow.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');

describe('Gateway 3 Resubmission Declaration page journeys', () => {
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

	it('Navigates to gateway 3 resubmission when back link is clicked', { tags: ['smoke'] }, () => {
		loadPlanDetails().then((plan) => {
			gateway3ResubmissionDeclarationPage.verifyLoaded();

			gateway3ResubmissionDeclarationPage.goBack();
			gateway3ResubmissionPage.verifyPathForPlan(plan.urlReference);
		});
	});

	it(
		'Navigates to gateway 3 resubmission complete page when confirm submission is clicked',
		{ tags: ['smoke'] },
		() => {
			loadPlanDetails().then((plan) => {
				gateway3ResubmissionDeclarationPage.verifyLoaded();

				gateway3ResubmissionDeclarationPage.confirmSubmissionButton.click();
				gateway3ResubmissionSubmissionCompletePage.verifyPathForPlan(plan.urlReference);
			});
		}
	);
});
