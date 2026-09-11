import { applicationCompletePage } from '../../../../page-objects/portal/gw2-application/application-complete-page.ts';
import { portalLogin } from '../../../../flows/portal/login-flow.ts';
import { planDetailsPage } from '../../../../page-objects/portal/plan-details/plan-details-page.ts';
import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';
import { myPlansPage } from '../../../../page-objects/portal/my-plans-page.ts';
import { gateway2ApplicationPage } from '../../../../page-objects/portal/gw2-application/gateway-2-application-page.ts';
import { localPlanTimetablePage } from '../../../../page-objects/portal/gw2-application/gateway-2-uploads.page.ts';
import { portalDeclarationPage } from '../../../../page-objects/portal/gw2-application/declaration-page.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');

describe('Application complete page journeys', () => {
	beforeEach(() => {
		portalLogin();
	});

	after(() => cy.task('clearDb'));

	it('Navigates to the plan details page', { tags: ['smoke'] }, () => {
		loadPlanDetails().then((plan) => {
			applicationCompletePage.visit(plan.urlReference);
			applicationCompletePage.verifyLoaded();

			applicationCompletePage.returnToYourPlanLink(plan.urlReference).click();
			planDetailsPage.verifyLoaded();
		});
	});

	it(
		'User navigates from sign in to application complete page while uploading a document for gateway 2',
		{ tags: ['regression'] },
		() => {
			loadPlanDetails().then((plan) => {
				myPlansPage.verifyLoaded();
				myPlansPage.openPlan(plan.reference);
				planDetailsPage.verifyLoaded();

				planDetailsPage.gateway2Link.click();
				gateway2ApplicationPage.verifyLoaded();

				gateway2ApplicationPage.clickAddLink(localPlanTimetablePage.addCy);
				localPlanTimetablePage.dragAndDropFile('test-document.xlsx');
				localPlanTimetablePage.clickUploadFiles();
				localPlanTimetablePage.verifyFileUploaded('test-document.xlsx');

				localPlanTimetablePage.saveAndReturn();
				gateway2ApplicationPage.verifyLoaded();
				gateway2ApplicationPage.submitGateway2AssessmentButton.click();

				portalDeclarationPage.verifyLoaded();
				portalDeclarationPage.confirmInformationCheckbox.click();
				portalDeclarationPage.privacyNoteCheckbox.click();
				portalDeclarationPage.confirmAndSubmitButton.click();

				applicationCompletePage.verifyLoaded();
			});
		}
	);
});
