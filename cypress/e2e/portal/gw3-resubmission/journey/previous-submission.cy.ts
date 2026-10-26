import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';
import { portalLogin } from '../../../../flows/portal/login-flow.ts';
import {
	seedGateway3SubmissionThree,
	submitGateway3Resubmission
} from '../../../../flows/portal/gateway-3-resubmission-flow.ts';
import { gateway3ResubmissionPage } from '../../../../page-objects/portal/gw3-application/gateway-3-resubmission-page.ts';
import { gateway3PreviousSubmissionPage } from '../../../../page-objects/portal/gw3-application/gateway-3-previous-submission-page.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');

describe('Gateway 3 submission 2 previous submission journeys', () => {
	beforeEach(() => {
		cy.task('clearDb');
		portalLogin();
		cy.task('seedGateway3Submitted');
		cy.task('seedGateway3Resubmission');
	});

	after(() => cy.task('clearDb'));

	it('Navigates to Submission 1 and back to the resubmission page', { tags: ['smoke'] }, () => {
		loadPlanDetails().then((plan) => {
			gateway3ResubmissionPage.visit(plan.urlReference);
			gateway3ResubmissionPage.clickPreviousSubmission(1);

			gateway3PreviousSubmissionPage.verifyLoaded('1');
			gateway3PreviousSubmissionPage.verifyPath(gateway3PreviousSubmissionPage.pathFor(plan.urlReference, 1));
			gateway3PreviousSubmissionPage.goBack();

			gateway3ResubmissionPage.verifyLoaded('2');
			gateway3ResubmissionPage.verifyPathForPlan(plan.urlReference);
		});
	});
});

describe('Gateway 3 submission 3 previous submission journeys', () => {
	beforeEach(() => {
		cy.task('clearDb');
		portalLogin();
		loadPlanDetails().then((plan) => seedGateway3SubmissionThree(plan.urlReference));
	});

	after(() => cy.task('clearDb'));

	it('Navigates from Submission 2 to Submission 1', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			gateway3ResubmissionPage.visit(plan.urlReference);
			gateway3ResubmissionPage.clickPreviousSubmission(2);

			gateway3PreviousSubmissionPage.verifyLoaded('2');
			gateway3PreviousSubmissionPage.clickPreviousSubmission(1);

			gateway3PreviousSubmissionPage.verifyLoaded('1');
			gateway3PreviousSubmissionPage.verifyPath(gateway3PreviousSubmissionPage.pathFor(plan.urlReference, 1));
		});
	});

	it('Navigates to the Submission completion page after submission 3 is completed', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			submitGateway3Resubmission(plan.urlReference, 'test-document.docx');
		});
	});
});
