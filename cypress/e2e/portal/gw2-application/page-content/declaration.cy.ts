import { portalDeclarationPage } from '../../../../page-objects/portal/gw2-application/declaration-page.ts';
import { portalLogin } from '../../../../flows/portal/login-flow.ts';
import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';
import { gateway2ApplicationPage } from '../../../../page-objects/portal/gw2-application/gateway-2-application-page.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');

describe('Declaration page content', () => {
	beforeEach(() => {
		portalLogin();
	});

	after(() => cy.task('clearDb'));

	it('Verifying page content for the declaration page', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			portalDeclarationPage.visit(plan.urlReference);
			portalDeclarationPage.verifyLoaded();
			portalDeclarationPage.verifyServiceNavigation('Guidance', 'Sign out');
			portalDeclarationPage.verifyBackLink(gateway2ApplicationPage.pathFor(plan.urlReference));
			portalDeclarationPage.verifyMainContains("This can't be undone.");
			portalDeclarationPage.verifyConfirmSubmissionButton();
			portalDeclarationPage.verifyNoGoBackLink(plan.urlReference);
		});
	});
});
