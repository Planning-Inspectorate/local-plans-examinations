import { portalLogin } from '../../../../flows/portal/login-flow.ts';
import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';
import { gateway3ResubmissionDeclarationPage } from '../../../../page-objects/portal/gw3-application/gateway-3-resubmission-declaration-page.ts';
import { gateway3ResubmissionPage } from '../../../../page-objects/portal/gw3-application/gateway-3-resubmission-page.ts';
import { openSeededResubmissionDeclarationPage } from '../../../../flows/portal/gateway-3-resubmission-flow.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');

describe('Gateway 3 Resubmission Declaration page content', () => {
	beforeEach(() => {
		cy.task('clearDb');
		portalLogin();
		loadPlanDetails().then((plan) => {
			openSeededResubmissionDeclarationPage(plan.urlReference);
		});
	});

	after(() => cy.task('clearDb'));

	it('Verifying page content for the gateway 3 resubmission declaration page', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			gateway3ResubmissionDeclarationPage.verifyLoaded();
			gateway3ResubmissionDeclarationPage.verifyServiceNavigation('Guidance', 'Sign out');
			gateway3ResubmissionDeclarationPage.verifyBackLink(gateway3ResubmissionPage.pathFor(plan.urlReference));
			gateway3ResubmissionDeclarationPage.verifyConfirmSubmissionButton();
			gateway3ResubmissionDeclarationPage.verifyGoBackButton();
		});
	});
});
