import { portalLogin } from '../../flows/portal/login-flow.ts';
import type { PlanDetailsFixture } from '../../fixtures/portal/types.ts';
import { submitGateway3Resubmission } from '../../flows/portal/gateway-3-resubmission-flow.ts';
import { issueGateway3ResubmissionDecisionInManage } from '../../flows/cross-service/gateway-3-resubmission-decision.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');

const LPA_RESUBMISSION_FILE = 'test-document.docx';
const BO_REPORT_FILE = 'test-document.pdf';

describe('Cross-service Gateway 3 resubmission', { baseUrl: Cypress.env('portalBaseUrl') }, () => {
	beforeEach(() => {
		cy.task('clearDb');
		portalLogin();
		cy.task('seedGateway3Submitted');
		cy.task('seedGateway3Resubmission');
	});

	after(() => cy.task('clearDb'));

	it(
		'User is able to complete a Gateway 3 resubmission in Portal and verify it in Manage',
		{ tags: ['regression'] },
		() => {
			loadPlanDetails().then((plan) => {
				submitGateway3Resubmission(plan.urlReference, LPA_RESUBMISSION_FILE);

				issueGateway3ResubmissionDecisionInManage(plan.reference, LPA_RESUBMISSION_FILE, BO_REPORT_FILE);
			});
		}
	);
});
