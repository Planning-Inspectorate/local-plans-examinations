import type { PlanDetailsFixture } from '../../fixtures/portal/types.ts';
import { examinationPage } from '../../page-objects/portal/examination/examination-application-page.ts';
import { examinationDeclarationPage } from '../../page-objects/portal/examination/declaration-page.ts';
import { examinationSubmissionCompletePage } from '../../page-objects/portal/examination/examination-submission-complete-page.ts';
import { planDetailsPage } from '../../page-objects/portal/plan-details/plan-details-page.ts';

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
