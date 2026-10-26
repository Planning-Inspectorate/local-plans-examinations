import { gateway3ResubmissionPage } from '../../page-objects/portal/gw3-application/gateway-3-resubmission-page.ts';
import { resubmissionDocumentsPage } from '../../page-objects/portal/gw3-application/gateway-3-uploads-page.ts';
import { gateway3DeclarationPage } from '../../page-objects/portal/gw3-application/declaration-page.ts';
import { gateway3SubmissionCompletePage } from '../../page-objects/portal/gw3-application/gateway-3-submission-complete-page.ts';

// Submission 1 data comes from both seedGateway3Submitted and seedGateway3Resubmission
const SUBMISSION_1_COMPLETION_DATE = new Date('2026-10-01T12:00:00.000Z');

// Submission 1 data comes from seedGateway3Resubmission
export const SUBMISSION_1 = {
	date: '1 October 2026',
	time: SUBMISSION_1_COMPLETION_DATE.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
	reportDate: '15 October 2026',
	reports: ['GW3Report-PLAN-001.pdf', 'GW3Report-Addendum-PLAN-001.pdf']
};

export const SUBMISSION_2 = {
	document: 'test-document.pdf',
	report: 'GW3Report-Submission-2.pdf'
};

export const todayDisplayDate = () =>
	new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

export const submitGateway3Resubmission = (planReference: string, fileName: string) => {
	gateway3ResubmissionPage.visit(planReference);
	gateway3ResubmissionPage.verifyLoaded();
	gateway3ResubmissionPage.clickAddLink(resubmissionDocumentsPage.addCy);

	resubmissionDocumentsPage.verifyLoaded();
	resubmissionDocumentsPage.uploadAndVerifyFile(fileName);
	resubmissionDocumentsPage.saveAndReturn();

	gateway3ResubmissionPage.verifyUploadedDocument(fileName);
	gateway3ResubmissionPage.submitButton.click();

	gateway3DeclarationPage.verifyLoaded();
	gateway3DeclarationPage.confirmSubmissionButton.click();

	gateway3SubmissionCompletePage.verifyLoaded();
};

// FO submits submission 2, then the BO (seed) triggers resubmission 3
export const seedGateway3SubmissionThree = (planReference: string) => {
	cy.task('seedGateway3Submitted');
	cy.task('seedGateway3Resubmission');
	submitGateway3Resubmission(planReference, SUBMISSION_2.document);
	cy.task('seedGateway3TriggerResubmission', { reportFileNames: [SUBMISSION_2.report] });
};
