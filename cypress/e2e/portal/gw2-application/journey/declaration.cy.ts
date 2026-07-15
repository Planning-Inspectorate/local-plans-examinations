import { portalLogin } from '../../../../flows/portal/login-flow.ts';
import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';
import { applicationCompletePage } from '../../../../page-objects/portal/gw2-application/application-complete-page.ts';
import { portalDeclarationPage } from '../../../../page-objects/portal/gw2-application/declaration-page.ts';
import { gateway2ApplicationPage } from '../../../../page-objects/portal/gw2-application/gateway-2-application-page.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');

describe('Declaration page journeys', () => {
	beforeEach(() => {
		portalLogin();
	});

	it('Navigates to gateway 2 application when back link is clicked', { tags: ['smoke'] }, () => {
		loadPlanDetails().then((plan) => {
			portalDeclarationPage.visit(plan.urlReference);
			portalDeclarationPage.verifyLoaded();

			portalDeclarationPage.backLink.click();
			gateway2ApplicationPage.verifyPathForPlan(plan.urlReference);
		});
	});

	it(
		'Navigates to application complete page when both checkboxes are checked and confirm and submit is clicked',
		{ tags: ['smoke'] },
		() => {
			loadPlanDetails().then((plan) => {
				portalDeclarationPage.visit(plan.urlReference);
				portalDeclarationPage.verifyLoaded();

				portalDeclarationPage.confirmInformationCheckbox.click();
				portalDeclarationPage.privacyNoteCheckbox.click();
				portalDeclarationPage.confirmAndSubmitButton.click();
				applicationCompletePage.verifyPathForPlan(plan.urlReference);
			});
		}
	);
});
