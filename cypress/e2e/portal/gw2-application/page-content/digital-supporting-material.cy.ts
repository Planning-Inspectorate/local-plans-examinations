import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';
import { portalLogin } from '../../../../flows/portal/login-flow.ts';
import { digitalSupportingMaterialPage } from '../../../../page-objects/portal/gw2-application/digital-supporting-material-page.ts';
import { gateway2ApplicationPage } from '../../../../page-objects/portal/gw2-application/gateway-2-application-page.ts';
import { digitalSupportingMaterial } from '../../../../fixtures/portal/digital-supporting-material.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');

describe('Gateway 2 digital supporting materials page content', () => {
	beforeEach(() => {
		portalLogin();
		loadPlanDetails().then((plan) => {
			gateway2ApplicationPage.visit(plan.urlReference);
			gateway2ApplicationPage.verifyLoaded();
		});
	});

	after(() => cy.task('clearDb'));

	it('Verify page content for digital supporting materials page', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			gateway2ApplicationPage.clickAddLink(digitalSupportingMaterialPage.addCy);
			digitalSupportingMaterialPage.verifyLoaded();
			digitalSupportingMaterialPage.verifyBackLink(gateway2ApplicationPage.pathFor(plan.urlReference));
			digitalSupportingMaterialPage.verifyServiceNavigation('Guidance', 'Sign out');
			digitalSupportingMaterialPage.verifyCaptionL(digitalSupportingMaterial.caption);
			digitalSupportingMaterialPage.verifyMainContains(...digitalSupportingMaterial.hintText);
			digitalSupportingMaterialPage.verifySaveAndReturnButton();
		});
	});
});
