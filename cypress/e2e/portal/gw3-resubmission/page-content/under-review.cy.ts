import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';
import { TEST_EMAIL, portalLogin } from '../../../../flows/portal/login-flow.ts';
import {
	SUBMISSION_1,
	SUBMISSION_2,
	seedGateway3CompleteAfterResubmission,
	seedGateway3SubmissionTwoUnderReview,
	todayDisplayDate,
	todayShortDisplayDate
} from '../../../../flows/portal/gateway-3-resubmission-flow.ts';
import { gateway3SubmittedResubmissionPage } from '../../../../page-objects/portal/gw3-application/gateway-3-submitted-resubmission-page.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');

const SUBMISSION_1_REPORT = {
	submissionNumber: 1,
	fileNames: SUBMISSION_1.reports,
	issuedDate: SUBMISSION_1.shortReportDate
};

// The BO proceed to examination report is issued today
const submission2Report = () => ({
	submissionNumber: 2,
	fileNames: [SUBMISSION_2.proceedReport],
	issuedDate: todayShortDisplayDate()
});

const verifyLatestSubmissionDocument = () => {
	gateway3SubmittedResubmissionPage.verifyCurrentSubmissionCopy(2, todayDisplayDate(), TEST_EMAIL);
	gateway3SubmittedResubmissionPage.verifyNewDocument(SUBMISSION_2.document);
	gateway3SubmittedResubmissionPage.verifyFileDownloads(
		gateway3SubmittedResubmissionPage.newDocumentsTable,
		SUBMISSION_2.document
	);
};

describe('Gateway 3 submission 2 under review page content', () => {
	beforeEach(() => {
		cy.task('clearDb');
		portalLogin();
		loadPlanDetails().then((plan) => seedGateway3SubmissionTwoUnderReview(plan.urlReference));
	});

	afterEach(() => cy.task('clearDb'));

	it(
		'Displays the Submission 1 report and row, then the submitted document of submission 2',
		{ tags: ['regression'] },
		() => {
			loadPlanDetails().then((plan) => {
				gateway3SubmittedResubmissionPage.visit(plan.urlReference);
				gateway3SubmittedResubmissionPage.verifyReports([SUBMISSION_1_REPORT]);
				gateway3SubmittedResubmissionPage.verifySubmissionRows(plan.urlReference, [
					{ submissionNumber: 1, submittedDate: SUBMISSION_1.shortDate }
				]);
				verifyLatestSubmissionDocument();
			});
		}
	);
});

describe('Gateway 3 complete after a resubmission page content', () => {
	beforeEach(() => {
		cy.task('clearDb');
		portalLogin();
		loadPlanDetails().then((plan) => seedGateway3CompleteAfterResubmission(plan.urlReference));
	});

	afterEach(() => cy.task('clearDb'));

	it(
		'Displays every Gateway 3 report and still downloads the LPA document after the BO report soft-deletes it',
		{ tags: ['regression'] },
		() => {
			loadPlanDetails().then((plan) => {
				gateway3SubmittedResubmissionPage.visit(plan.urlReference);
				gateway3SubmittedResubmissionPage.verifyReports([submission2Report(), SUBMISSION_1_REPORT]);
				gateway3SubmittedResubmissionPage.verifyReportDownload(2, SUBMISSION_2.proceedReport);
				verifyLatestSubmissionDocument();
			});
		}
	);
});
