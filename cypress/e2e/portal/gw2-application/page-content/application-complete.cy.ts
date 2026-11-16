import { applicationCompletePage } from '../../../../page-objects/portal/gw2-application/application-complete-page.ts';
import { portalLogin } from '../../../../flows/portal/login-flow.ts';
import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');

describe('Application Complete page content', () => {
	beforeEach(() => {
		portalLogin();
	});

	it('Verifying page content for the application complete page', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			applicationCompletePage.visit(plan.urlReference);
			applicationCompletePage.verifyLoaded();
			applicationCompletePage.verifyServiceNavigation('Guidance', 'Sign out');
			applicationCompletePage.verifyMainContains(
				'Gateway 2 submission complete',
				"We've sent you a confirmation email.",
				'What happens next',
				'An assessor will be appointed to your case in the next few days',
				'Your case officer will:',
				'contact you to arrange a workshop, which is likely to be 2 consecutive days in the week beginning to be confirmed',
				'let you know whether this workshop will be online or in-person',
				'contact you if they need further information before or after the workshop',
				'They will usually send the assessment report within 2 weeks of the workshop',
				'At any point you can check your submission status'
			);
			applicationCompletePage.verifyReturnToYourPlanLink(plan.urlReference);
		});
	});
});
