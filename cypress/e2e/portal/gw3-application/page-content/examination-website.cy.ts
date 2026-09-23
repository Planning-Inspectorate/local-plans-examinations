import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';
import { portalLogin } from '../../../../flows/portal/login-flow.ts';
import { gateway3ApplicationPage } from '../../../../page-objects/portal/gw3-application/gateway-3-application-page.ts';
import { examinationWebsitePage } from '../../../../page-objects/portal/gw3-application/examination-website-page.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');

describe('Gateway 3 examination website page content', () => {
	beforeEach(() => {
		portalLogin();
		loadPlanDetails().then((plan) => {
			gateway3ApplicationPage.visit(plan.urlReference);
			gateway3ApplicationPage.verifyLoaded();
		});
	});

	it('Verify page content for examination website page', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			gateway3ApplicationPage.clickAddLink(examinationWebsitePage.addCy);
			examinationWebsitePage.verifyLoaded();
			examinationWebsitePage.verifyBackLink(gateway3ApplicationPage.pathFor(plan.urlReference));
			examinationWebsitePage.verifyServiceNavigation('Guidance', 'Sign out');
			examinationWebsitePage.verifyCaptionL('Required Information');
			examinationWebsitePage.verifyHintText('Enter the web address (URL) where your examination library is published');
		});
	});
});
