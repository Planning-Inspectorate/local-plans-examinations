import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';
import { portalLogin } from '../../../../flows/portal/login-flow.ts';
import {
	seedGateway3CompleteAfterResubmission,
	seedGateway3SubmissionTwoUnderReview,
	todayDisplayDate
} from '../../../../flows/portal/gateway-3-resubmission-flow.ts';
import { planDetailsPage } from '../../../../page-objects/portal/plan-details/plan-details-page.ts';
import { gateway3SubmittedResubmissionPage } from '../../../../page-objects/portal/gw3-application/gateway-3-submitted-resubmission-page.ts';
import { gateway3PreviousSubmissionPage } from '../../../../page-objects/portal/gw3-application/gateway-3-previous-submission-page.ts';
import { gateway3UploadAnswers } from '../../../../fixtures/portal/gateway-3-uploads.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');

describe('Gateway 3 under review page journeys', () => {
	beforeEach(() => {
		cy.task('clearDb');
		portalLogin();
		loadPlanDetails().then((plan) => seedGateway3SubmissionTwoUnderReview(plan.urlReference));
	});

	afterEach(() => cy.task('clearDb'));

	it('Opens the under review page from the Gateway 3 link on plan details', { tags: ['smoke'] }, () => {
		loadPlanDetails().then((plan) => {
			planDetailsPage.visit(plan.urlReference);
			planDetailsPage.verifyProgressRow('Gateway 3', `Submitted: ${todayDisplayDate()}`, plan.underReview);
			planDetailsPage.gateway3Link.should('be.visible').click();

			gateway3SubmittedResubmissionPage.verifyPathForPlan(plan.urlReference);
			gateway3SubmittedResubmissionPage.verifyLoaded('2');
		});
	});

	it('Navigates to Plan Details page when the Back link is clicked', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			gateway3SubmittedResubmissionPage.visit(plan.urlReference);
			gateway3SubmittedResubmissionPage.verifyLoaded('2');
			gateway3SubmittedResubmissionPage.goBack();
			planDetailsPage.verifyPathForPlan(plan.urlReference);
		});
	});

	it(
		'Opens the Submission 1 page from View all documents and returns with the back link',
		{ tags: ['regression'] },
		() => {
			loadPlanDetails().then((plan) => {
				gateway3SubmittedResubmissionPage.visit(plan.urlReference);
				gateway3SubmittedResubmissionPage.clickViewAllDocuments(1);

				gateway3PreviousSubmissionPage.verifyLoaded('1', plan.underReview);
				gateway3PreviousSubmissionPage.goBack();

				gateway3SubmittedResubmissionPage.verifyLoaded('2');
			});
		}
	);

	it('Redirects the upload page to Plan Details once the resubmission is sent', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			const { section, path } = gateway3UploadAnswers.resubmissionDocuments;
			cy.visit(`/manage-local-plans/${plan.urlReference}/${section}/${path}`);
			planDetailsPage.verifyPathForPlan(plan.urlReference);
		});
	});
});

describe('Gateway 3 complete after a resubmission journeys', () => {
	beforeEach(() => {
		cy.task('clearDb');
		portalLogin();
		loadPlanDetails().then((plan) => seedGateway3CompleteAfterResubmission(plan.urlReference));
	});

	afterEach(() => cy.task('clearDb'));

	it('Opens the completed Gateway 3 page from plan details in examination', { tags: ['smoke'] }, () => {
		loadPlanDetails().then((plan) => {
			planDetailsPage.visit(plan.urlReference);
			planDetailsPage.verifyProgressRow('Gateway 3', `Completed: ${todayDisplayDate()}`, 'Completed');
			planDetailsPage.gateway3Link.should('be.visible').click();

			gateway3SubmittedResubmissionPage.verifyPathForPlan(plan.urlReference);
			gateway3SubmittedResubmissionPage.verifyLoaded('2');
			gateway3SubmittedResubmissionPage.verifySubmissionStatus('Completed');
		});
	});

	it('Opens the Submission 1 page with the Completed tag', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			gateway3SubmittedResubmissionPage.visit(plan.urlReference);
			gateway3SubmittedResubmissionPage.clickViewAllDocuments(1);

			gateway3PreviousSubmissionPage.verifyLoaded('1', 'Completed');
		});
	});
});
