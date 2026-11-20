import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';
import { TEST_EMAIL, portalLogin } from '../../../../flows/portal/login-flow.ts';
import {
	SUBMISSION_1,
	SUBMISSION_2,
	SUBMISSION_3,
	seedGateway3CompleteAfterResubmission,
	seedGateway3SubmissionThreeUnderReview,
	seedGateway3SubmissionTwoUnderReview,
	todayDisplayDate,
	todayShortDisplayDate
} from '../../../../flows/portal/gateway-3-resubmission-flow.ts';
import { gateway3SubmittedResubmissionPage } from '../../../../page-objects/portal/gw3-application/gateway-3-submitted-resubmission-page.ts';
import { gateway3PreviousSubmissionPage } from '../../../../page-objects/portal/gw3-application/gateway-3-previous-submission-page.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');

const SUBMISSION_1_REPORT = {
	submissionNumber: 1,
	fileNames: SUBMISSION_1.reports,
	issuedDate: SUBMISSION_1.shortReportDate
};

describe('Gateway 3 submission 2 under review page content', () => {
	beforeEach(() => {
		cy.task('clearDb');
		portalLogin();
		loadPlanDetails().then((plan) => seedGateway3SubmissionTwoUnderReview(plan.urlReference));
	});

	afterEach(() => cy.task('clearDb'));

	it(
		'Displays the heading, plan caption and Under review tag without editing controls',
		{ tags: ['regression'] },
		() => {
			loadPlanDetails().then((plan) => {
				gateway3SubmittedResubmissionPage.visit(plan.urlReference);
				gateway3SubmittedResubmissionPage.verifyLoaded('2');
				gateway3SubmittedResubmissionPage.verifyCaption(plan.title);
				gateway3SubmittedResubmissionPage.verifySubmissionStatus(plan.underReview);
				gateway3SubmittedResubmissionPage.verifyBackLink(`/manage-local-plans/${plan.urlReference}`);
				gateway3SubmittedResubmissionPage.verifyServiceNavigation('Guidance', 'Sign out');
				gateway3SubmittedResubmissionPage.verifyNoEditingControls();
			});
		}
	);

	it('Displays the Submission 1 report and the Submission 1 row', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			gateway3SubmittedResubmissionPage.visit(plan.urlReference);
			gateway3SubmittedResubmissionPage.verifyReports([SUBMISSION_1_REPORT]);
			gateway3SubmittedResubmissionPage.verifySubmissionRows(plan.urlReference, [
				{ submissionNumber: 1, submittedDate: SUBMISSION_1.shortDate }
			]);
			gateway3SubmittedResubmissionPage.verifyReportsListedBeforeSubmissions();
		});
	});

	it('Displays the latest submission copy and its new or updated document', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			gateway3SubmittedResubmissionPage.visit(plan.urlReference);
			gateway3SubmittedResubmissionPage.verifyCurrentSubmissionCopy(2, todayDisplayDate(), TEST_EMAIL);
			gateway3SubmittedResubmissionPage.verifyNewDocuments([SUBMISSION_2.document]);
			gateway3SubmittedResubmissionPage.verifyFileDownloads(
				gateway3SubmittedResubmissionPage.newDocumentsTable,
				SUBMISSION_2.document
			);
		});
	});

	it('Displays the Under review tag on the Submission 1 page', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			gateway3PreviousSubmissionPage.visitSubmission(plan.urlReference, 1);
			gateway3PreviousSubmissionPage.verifyLoaded('1', plan.underReview);
			gateway3PreviousSubmissionPage.verifyReport(1, SUBMISSION_1.reports, `issued ${SUBMISSION_1.reportDate}`);
		});
	});
});

describe('Gateway 3 submission 3 under review page content', () => {
	beforeEach(() => {
		cy.task('clearDb');
		portalLogin();
		loadPlanDetails().then((plan) => seedGateway3SubmissionThreeUnderReview(plan.urlReference));
	});

	afterEach(() => cy.task('clearDb'));

	it('Displays the reports and previous submissions in descending order', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			gateway3SubmittedResubmissionPage.visit(plan.urlReference);
			gateway3SubmittedResubmissionPage.verifyLoaded('3');
			gateway3SubmittedResubmissionPage.verifySubmissionStatus(plan.underReview);
			gateway3SubmittedResubmissionPage.verifyReports([
				{ submissionNumber: 2, fileNames: [SUBMISSION_2.report], issuedDate: todayShortDisplayDate() },
				SUBMISSION_1_REPORT
			]);
			gateway3SubmittedResubmissionPage.verifySubmissionRows(plan.urlReference, [
				{ submissionNumber: 2, submittedDate: todayShortDisplayDate() },
				{ submissionNumber: 1, submittedDate: SUBMISSION_1.shortDate }
			]);
			gateway3SubmittedResubmissionPage.verifyReportsListedBeforeSubmissions();
			gateway3SubmittedResubmissionPage.verifyReportDownload(2, SUBMISSION_2.report);
		});
	});

	it('Displays the submission 3 copy and its documents as bullet points', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			gateway3SubmittedResubmissionPage.visit(plan.urlReference);
			gateway3SubmittedResubmissionPage.verifyCurrentSubmissionCopy(3, todayDisplayDate(), TEST_EMAIL);
			gateway3SubmittedResubmissionPage.verifyNewDocuments(SUBMISSION_3.documents);
		});
	});
});

describe('Gateway 3 complete after a resubmission page content', () => {
	beforeEach(() => {
		cy.task('clearDb');
		portalLogin();
		loadPlanDetails().then((plan) => seedGateway3CompleteAfterResubmission(plan.urlReference));
	});

	afterEach(() => cy.task('clearDb'));

	it('Displays the Completed tag with every Gateway 3 report and submission', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			gateway3SubmittedResubmissionPage.visit(plan.urlReference);
			gateway3SubmittedResubmissionPage.verifyLoaded('2');
			gateway3SubmittedResubmissionPage.verifySubmissionStatus('Completed');
			gateway3SubmittedResubmissionPage.verifyReports([
				{ submissionNumber: 2, fileNames: [SUBMISSION_2.proceedReport], issuedDate: todayShortDisplayDate() },
				SUBMISSION_1_REPORT
			]);
			gateway3SubmittedResubmissionPage.verifySubmissionRows(plan.urlReference, [
				{ submissionNumber: 1, submittedDate: SUBMISSION_1.shortDate }
			]);
			gateway3SubmittedResubmissionPage.verifyNoEditingControls();
		});
	});

	it('Still displays the LPA document after the BO report soft-deletes it', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			gateway3SubmittedResubmissionPage.visit(plan.urlReference);
			gateway3SubmittedResubmissionPage.verifyCurrentSubmissionCopy(2, todayDisplayDate(), TEST_EMAIL);
			gateway3SubmittedResubmissionPage.verifyNewDocuments([SUBMISSION_2.document]);
			gateway3SubmittedResubmissionPage.verifyFileDownloads(
				gateway3SubmittedResubmissionPage.newDocumentsTable,
				SUBMISSION_2.document
			);
			gateway3SubmittedResubmissionPage.verifyReportDownload(2, SUBMISSION_2.proceedReport);
		});
	});
});
