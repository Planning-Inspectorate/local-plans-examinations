import {
	submitExaminationInPortal,
	uploadExaminationDocumentInPortal
} from '../../flows/cross-service/examination-submission-flow.ts';
import { openExaminationPage } from '../../flows/manage/examination-flow.ts';
import { manageToPortalLogin, TEST_EMAIL } from '../../flows/portal/login-flow.ts';
import { examinationDocuments } from '../../fixtures/manage/examination.ts';
import { examinationSubmissionWebsite } from '../../fixtures/portal/examination-website.ts';
import type { PlanDetailsFixture } from '../../fixtures/portal/types.ts';
import { examinationDocumentsPage, examinationPage } from '../../page-objects/manage/examination/index.ts';
import { manageHomePage } from '../../page-objects/manage/home-page.ts';

describe('Cross-service Examination submission', () => {
	beforeEach(() => {
		cy.task('clearDb');
		cy.task('seedCase');
		cy.task('seedExaminationReadyToStart');
		cy.task('seedExaminationDeclarationDocuments');
	});

	after(() => cy.task('clearDb'));

	it(
		'makes the Portal website and uploaded file reviewable and downloadable only after submission',
		{ tags: ['regression'] },
		() => {
			cy.fixture<PlanDetailsFixture>('portal/plan-details.json').then((plan) => {
				const currentCase = { reference: plan.reference, planTitle: plan.title };
				const fileName = 'test-document.pdf';
				openExaminationPage(currentCase);
				manageToPortalLogin(TEST_EMAIL);
				uploadExaminationDocumentInPortal(plan.reference, fileName);

				openExaminationPage(currentCase);
				examinationPage.verifyHeaderStatus('Submission pending');
				examinationPage.verifyNoSubmissionDocumentsReviewLink();
				submitExaminationInPortal(plan.reference);

				openExaminationPage(currentCase);
				examinationPage.verifyHeaderStatus('Submission received');
				examinationPage.verifySummaryRowContains(
					examinationSubmissionWebsite.row,
					examinationSubmissionWebsite.updatedValue
				);
				examinationPage.openActionLinkFor(examinationDocuments.row);
				examinationDocumentsPage.verifyLoaded();
				examinationDocumentsPage.verifyExaminationWebsite(
					examinationSubmissionWebsite.updatedValue,
					examinationSubmissionWebsite.updatedValue
				);
				examinationDocumentsPage.verifyDocumentDownload('required', examinationDocuments.required[0].label, fileName);
				manageHomePage.visit();
				manageHomePage.verifyCaseStatus(plan.title, 'Submission received');
			});
		}
	);
});
