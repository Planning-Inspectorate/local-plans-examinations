import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';
import { TEST_EMAIL, portalLogin } from '../../../../flows/portal/login-flow.ts';
import {
	SUBMISSION_1,
	SUBMISSION_2,
	seedGateway3SubmissionThree,
	todayDisplayDate
} from '../../../../flows/portal/gateway-3-resubmission-flow.ts';
import { gateway3ResubmissionPage } from '../../../../page-objects/portal/gw3-application/gateway-3-resubmission-page.ts';
import { gateway3PreviousSubmissionPage } from '../../../../page-objects/portal/gw3-application/gateway-3-previous-submission-page.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');

describe('Gateway 3 submission 2 previous submissions page content', () => {
	beforeEach(() => {
		cy.task('clearDb');
		portalLogin();
		cy.task('seedGateway3Submitted');
		cy.task('seedGateway3Resubmission');
	});

	afterEach(() => cy.task('clearDb'));

	it('Displays the Submission 1 report document and Submission 1 link', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			gateway3ResubmissionPage.visit(plan.urlReference);
			gateway3ResubmissionPage.verifyLoaded('2');
			gateway3ResubmissionPage.verifyReport(1, SUBMISSION_1.reports, `shared on ${SUBMISSION_1.reportDate}`);
			gateway3ResubmissionPage.verifyPreviousSubmissions(plan.urlReference, [SUBMISSION_1.date]);
		});
	});

	it('Displays the Submission 1 page with the report and submitted documents', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			gateway3PreviousSubmissionPage.visitSubmission(plan.urlReference, 1);
			gateway3PreviousSubmissionPage.verifyLoaded('1');
			gateway3PreviousSubmissionPage.verifyBackLink(gateway3ResubmissionPage.pathFor(plan.urlReference));
			gateway3PreviousSubmissionPage.verifyReport(1, SUBMISSION_1.reports, `issued ${SUBMISSION_1.reportDate}`);
			gateway3PreviousSubmissionPage.verifySubmissionCopy(SUBMISSION_1.date, SUBMISSION_1.time, TEST_EMAIL);
			gateway3PreviousSubmissionPage.verifyDocumentRowContains(
				gateway3PreviousSubmissionPage.requiredInformationTable,
				'Map of proposed local plan policies',
				'g3-map-of-policies.pdf',
				'map-of-policies.pdf'
			);
			gateway3PreviousSubmissionPage.verifyDocumentRowContains(
				gateway3PreviousSubmissionPage.requiredInformationTable,
				'Statement of Compliance',
				'g3-stat-compliance.pdf',
				'statement-of-compliance.pdf'
			);
		});
	});
});

describe('Gateway 3 submission 3 previous submissions page content', () => {
	beforeEach(() => {
		cy.task('clearDb');
		portalLogin();
		loadPlanDetails().then((plan) => seedGateway3SubmissionThree(plan.urlReference));
	});

	afterEach(() => cy.task('clearDb'));

	it('Displays the Submission 2 report and both previous submissions', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			gateway3ResubmissionPage.visit(plan.urlReference);
			gateway3ResubmissionPage.verifyLoaded('3');
			gateway3ResubmissionPage.verifyReport(2, [SUBMISSION_2.report], `shared on ${todayDisplayDate()}`);
			gateway3ResubmissionPage.verifyPreviousSubmissions(plan.urlReference, [SUBMISSION_1.date, todayDisplayDate()]);
		});
	});

	it('Displays the Submission 2 page with its report and new or updated documents', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			gateway3PreviousSubmissionPage.visitSubmission(plan.urlReference, 2);
			gateway3PreviousSubmissionPage.verifyLoaded('2');
			gateway3PreviousSubmissionPage.verifyReport(2, [SUBMISSION_2.report], `shared on ${todayDisplayDate()}`);
			gateway3PreviousSubmissionPage.verifyPreviousSubmissions(plan.urlReference, [SUBMISSION_1.date]);
			gateway3PreviousSubmissionPage.submissionCopy.should(
				'contain.text',
				`Your submission was sent on ${todayDisplayDate()}`
			);
			gateway3PreviousSubmissionPage.newDocumentsTable.should('contain.text', SUBMISSION_2.document);
			gateway3PreviousSubmissionPage.verifyFileDownloads(gateway3PreviousSubmissionPage.reportRow, SUBMISSION_2.report);
			gateway3PreviousSubmissionPage.verifyFileDownloads(
				gateway3PreviousSubmissionPage.newDocumentsTable,
				SUBMISSION_2.document
			);
		});
	});

	it('Still displays the original Submission 1 page after a second resubmission', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			gateway3PreviousSubmissionPage.visitSubmission(plan.urlReference, 1);
			gateway3PreviousSubmissionPage.verifyLoaded('1');
			gateway3PreviousSubmissionPage.verifyReport(1, SUBMISSION_1.reports, `issued ${SUBMISSION_1.reportDate}`);
		});
	});
});
