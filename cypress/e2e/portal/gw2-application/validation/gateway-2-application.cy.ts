import { portalLogin } from '../../../../flows/portal/login-flow.ts';
import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';
import { gateway2ApplicationPage } from '../../../../page-objects/portal/gw2-application/gateway-2-application-page.ts';
import { ERROR_MESSAGES } from 'cypress/constants/portal/error-messages.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');

describe('Gateway 2 application page validation tests', () => {
	beforeEach(() => {
		portalLogin();
		loadPlanDetails().then((plan) => {
			gateway2ApplicationPage.visit(plan.urlReference);
			gateway2ApplicationPage.verifyLoaded();
		});
	});

	it('Shows error message when Submit is clicked and no documents have been added', { tags: ['regression'] }, () => {
		gateway2ApplicationPage.submitGateway2Assessmentbutton.click();
		gateway2ApplicationPage.verifyErrorSummary(ERROR_MESSAGES.THERE_IS_A_PROBLEM, ERROR_MESSAGES.ADD_ONE_DOCUMENT);
		gateway2ApplicationPage.verifyFieldErrorContains(ERROR_MESSAGES.ADD_ONE_DOCUMENT);
	});
});
