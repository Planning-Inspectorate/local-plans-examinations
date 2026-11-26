import type { PlanDetailsFixture } from '../../fixtures/portal/types.ts';
import { examinationPage } from '../../page-objects/portal/examination/examination-application-page.ts';
import { examinationDeclarationPage } from '../../page-objects/portal/examination/declaration-page.ts';
import { examinationSubmissionCompletePage } from '../../page-objects/portal/examination/examination-submission-complete-page.ts';
import { planDetailsPage } from '../../page-objects/portal/plan-details/plan-details-page.ts';
import type { DocumentUploadPage } from '../../page-objects/portal/base/document-upload-page.ts';

export type ExaminationDocumentUpload = {
	page: DocumentUploadPage;
	fileNames: string[];
};
export const submitExaminationApplication = (
	plan: Pick<PlanDetailsFixture, 'urlReference'>,
	uploads: ExaminationDocumentUpload[]
) => {
	examinationPage.visit(plan.urlReference);
	examinationPage.verifyLoaded();

	uploads.forEach(({ page, fileNames }) => {
		examinationPage.clickAddLink(page.addCy);
		page.verifyLoaded();
		page.uploadAndVerifyFiles(fileNames);
		page.saveAndReturn();
		examinationPage.verifyLoaded();
	});

	examinationPage.submitExaminationButton.click();
	examinationDeclarationPage.verifyLoaded();
};

export const openExaminationDocumentUploadPage = (
	plan: Pick<PlanDetailsFixture, 'urlReference'>,
	page: DocumentUploadPage
) => {
	examinationPage.visit(plan.urlReference);
	examinationPage.verifyLoaded();
	examinationPage.clickAddLink(page.addCy);
	page.verifyLoaded();
};

export const openSeededExaminationDeclarationPage = (plan: Pick<PlanDetailsFixture, 'urlReference'>) => {
	cy.task('seedExaminationReadyToStart');
	cy.task('seedExaminationDeclarationDocuments');
	examinationPage.visit(plan.urlReference);
	examinationPage.verifyLoaded();
	examinationPage.submitExaminationButton.click();
	examinationDeclarationPage.verifyLoaded();
};

export const openSeededExaminationSubmission = (plan: Pick<PlanDetailsFixture, 'urlReference'>) => {
	openSeededExaminationDeclarationPage(plan);
	examinationDeclarationPage.confirmSubmissionButton.click();
	examinationSubmissionCompletePage.verifyLoaded();
	examinationSubmissionCompletePage.checkSubmissionStatusLink.click();
	planDetailsPage.verifyLoaded();
};
