import { portalLogin } from '../../../../flows/portal/login-flow.ts';
import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';
import { gateway3ApplicationPage } from '../../../../page-objects/portal/gw3-application/gateway-3-application-page.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');

describe('Gateway 3 application page content', () => {
	beforeEach(() => {
		portalLogin();
		loadPlanDetails().then((plan) => {
			gateway3ApplicationPage.visit(plan.urlReference);
			gateway3ApplicationPage.verifyLoaded();
		});
	});

	it('Shows plan title, page header, inset text and copy text', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			gateway3ApplicationPage.verifyServiceNavigation('Guidance', 'Sign out');
			gateway3ApplicationPage.verifyBackLink(`/manage-local-plans/${plan.urlReference}`);
			gateway3ApplicationPage.verifyCaption(plan.title);
			gateway3ApplicationPage.verifyHeading('Gateway 3 submission');
			gateway3ApplicationPage.verifyMainContains(
				'Gateway 3 is a more formal step in the development of your local plan. At this point some documents are mandatory to submit.',
				`You have provided the expected submission date of ${plan.dates.gateway3}. The assessment usually takes between 4 and 6 weeks from submission.`,
				'Save and come back later'
			);
			gateway3ApplicationPage.verifySaveAndComeBackLink(`/manage-local-plans/${plan.urlReference}`);
		});
	});
});
