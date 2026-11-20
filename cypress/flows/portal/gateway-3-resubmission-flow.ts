import { gateway3ResubmissionPage } from '../../page-objects/portal/gw3-application/gateway-3-resubmission-page.ts';
import { resubmissionDocumentsPage } from '../../page-objects/portal/gw3-application/gateway-3-uploads-page.ts';
import { gateway3ResubmissionDeclarationPage } from '../../page-objects/portal/gw3-application/gateway-3-resubmission-declaration-page.ts';
import { gateway3ResubmissionSubmissionCompletePage } from '../../page-objects/portal/gw3-application/gateway-3-resubmission-submission-complete-page.ts';

// Submission 1 data comes from both seedGateway3Submitted and seedGateway3Resubmission
const SUBMISSION_1_COMPLETION_DATE = new Date('2026-10-01T12:00:00.000Z');

// Submission 1 data comes from seedGateway3Resubmission
export const SUBMISSION_1 = {
	date: '1 October 2026',
	shortDate: '1 Oct 2026',
	time: SUBMISSION_1_COMPLETION_DATE.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
	reportDate: '15 October 2026',
	shortReportDate: '15 Oct 2026',
	reports: ['GW3Report-PLAN-001.pdf', 'GW3Report-Addendum-PLAN-001.pdf']
};

export const SUBMISSION_2 = {
	document: 'test-document.pdf',
	report: 'GW3Report-Submission-2.pdf',
	proceedReport: 'GW3Report-Proceed-PLAN-001.pdf'
};

export const SUBMISSION_3 = {
	documents: ['test-document.pdf', 'test-document.docx']
};

export const openResubmissionDeclarationPage = (planReference: string, fileName = SUBMISSION_2.document) => {
	gateway3ResubmissionPage.visit(planReference);
	gateway3ResubmissionPage.verifyLoaded();
	gateway3ResubmissionPage.clickAddLink(resubmissionDocumentsPage.addCy);

	resubmissionDocumentsPage.verifyLoaded();
	resubmissionDocumentsPage.uploadAndVerifyFile(fileName);
	resubmissionDocumentsPage.saveAndReturn();

	gateway3ResubmissionPage.verifyUploadedDocument(fileName);
	gateway3ResubmissionPage.submitButton.click();
};

export const todayDisplayDate = () =>
	new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

// Short month format used in the report and submission rows of the under review page
export const todayShortDisplayDate = () =>
	new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export const submitGateway3Resubmission = (planReference: string, fileName = SUBMISSION_2.document) => {
	openResubmissionDeclarationPage(planReference, fileName);

	gateway3ResubmissionDeclarationPage.verifyLoaded();
	gateway3ResubmissionDeclarationPage.confirmSubmissionButton.click();

	gateway3ResubmissionSubmissionCompletePage.verifyLoaded();
};

// FO submits submission 2, then the BO (seed) triggers resubmission 3
export const seedGateway3SubmissionThree = (planReference: string) => {
	cy.task('seedGateway3Submitted');
	cy.task('seedGateway3Resubmission');
	submitGateway3Resubmission(planReference);
	cy.task('seedGateway3TriggerResubmission', { reportFileNames: [SUBMISSION_2.report] });
};

export const openSeededResubmissionDeclarationPage = (planReference: string) => {
	cy.task('seedGateway3Submitted');
	cy.task('seedGateway3Resubmission');
	openResubmissionDeclarationPage(planReference);
};

// Uploads several files in one go, then submits the resubmission through the declaration
export const submitGateway3ResubmissionFiles = (planReference: string, fileNames: string[]) => {
	gateway3ResubmissionPage.visit(planReference);
	gateway3ResubmissionPage.verifyLoaded();
	gateway3ResubmissionPage.clickAddLink(resubmissionDocumentsPage.addCy);

	resubmissionDocumentsPage.verifyLoaded();
	resubmissionDocumentsPage.uploadFile(fileNames);
	resubmissionDocumentsPage.clickUploadFiles();
	resubmissionDocumentsPage.verifyFileUploaded(...fileNames);
	resubmissionDocumentsPage.saveAndReturn();

	gateway3ResubmissionPage.submitButton.click();
	gateway3ResubmissionDeclarationPage.verifyLoaded();
	gateway3ResubmissionDeclarationPage.confirmSubmissionButton.click();
	gateway3ResubmissionSubmissionCompletePage.verifyLoaded();
};

// FO submits submission 2, which is now under review
export const seedGateway3SubmissionTwoUnderReview = (planReference: string) => {
	cy.task('seedGateway3Submitted');
	cy.task('seedGateway3Resubmission');
	submitGateway3Resubmission(planReference);
};

// FO submits submission 2, the BO (seed) triggers resubmission 3, then FO submits submission 3
export const seedGateway3SubmissionThreeUnderReview = (planReference: string) => {
	seedGateway3SubmissionThree(planReference);
	submitGateway3ResubmissionFiles(planReference, SUBMISSION_3.documents);
};

// FO submits submission 2, then the BO (seed) proceeds the plan to examination
export const seedGateway3CompleteAfterResubmission = (planReference: string) => {
	seedGateway3SubmissionTwoUnderReview(planReference);
	cy.task('seedGateway3ProceedToExamination', { reportFileNames: [SUBMISSION_2.proceedReport] });
};
