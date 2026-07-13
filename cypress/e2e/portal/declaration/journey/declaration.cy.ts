import { completePortalLogin, startPortalOtpLogin } from '../../../../flows/portal/login-flow.ts';
import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';
import { applicationCompletePage } from '../../../../page-objects/portal/declaration/application-complete-page.ts';
import { portalDeclarationPage } from '../../../../page-objects/portal/declaration/declaration-page.ts';
import { gateway2ApplicationPage } from '../../../../page-objects/portal/declaration/gateway-2-application-page.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');

describe('Declaration page journeys', () => {
	beforeEach(() => {
		cy.setCookie('cookie_consent', 'accept');
		startPortalOtpLogin();
		completePortalLogin();
	});

	it('Navigates to gateway 2 application when back link is clicked', { tags: ['smoke'] }, () => {
		loadPlanDetails().then((plan) => {
			portalDeclarationPage.visit(plan.urlReference);
			portalDeclarationPage.verifyLoaded();
			portalDeclarationPage.verifyHeading('Review declaration');

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
				portalDeclarationPage.verifyHeading('Review declaration');

				portalDeclarationPage.confirmInformationCheckbox.click();
				portalDeclarationPage.privacyNoteCheckbox.click();
				portalDeclarationPage.confirmAndSubmitButton.click();
				applicationCompletePage.verifyPathForPlan(plan.urlReference);
			});
		}
	);
});
