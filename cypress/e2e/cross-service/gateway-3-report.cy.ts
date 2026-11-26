import { verifyGateway3CompletedInPortal } from '../../flows/cross-service/gateway-3-report-flow.ts';
import { issueGateway3ProceedDecision, openGateway3Page } from '../../flows/manage/gateway-3-flow.ts';
import { manageToPortalLogin, TEST_EMAIL } from '../../flows/portal/login-flow.ts';
import { gateway3DocumentsAnswer } from '../../fixtures/manage/gateway-3.ts';
import type { PlanDetailsFixture } from '../../fixtures/portal/types.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');
const todayDisplay = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

describe('Cross-service Gateway 3 report', () => {
	beforeEach(() => {
		cy.task('clearDb');
		cy.task('seedCase');
		cy.task('seedGateway3Submitted');
	});

	after(() => cy.task('clearDb'));

	it(
		'Shows Gateway 3 as completed and Examination as ready to start in Portal once the proceed decision is issued in Manage',
		{ tags: ['regression'] },
		() => {
			loadPlanDetails().then((plan) => {
				openGateway3Page(plan.reference, plan.title);

				manageToPortalLogin(TEST_EMAIL);

				openGateway3Page(plan.reference, plan.title);
				issueGateway3ProceedDecision(plan.title);

				verifyGateway3CompletedInPortal(
					plan.reference,
					gateway3DocumentsAnswer.fileName,
					todayDisplay,
					plan.dates.examination
				);
			});
		}
	);
});
