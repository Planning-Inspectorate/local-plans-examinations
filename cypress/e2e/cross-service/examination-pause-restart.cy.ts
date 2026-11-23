import { manageToPortalLogin, TEST_EMAIL } from '../../flows/portal/login-flow.ts';
import type { PlanDetailsFixture } from '../../fixtures/portal/types.ts';
import { caseHistoryPage } from '../../page-objects/manage/case-history/index.ts';
import { pauseExamination, restartExamination, openExaminationPage } from '../../flows/manage/examination-flow.ts';
import { verifyPortalSubmissionHintText } from '../../flows/cross-service/verify-plan-detail-hint-flow.ts';
import { examinationPage } from '../../page-objects/manage/examination/index.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');

const openCaseHistory = () => {
	examinationPage.openServiceNavigationItem('Case History');
	caseHistoryPage.verifyLoaded();
};

describe('Cross-service Examination pauses', () => {
	beforeEach(() => {
		cy.task('clearDb');
		cy.task('seedCase');
		cy.task('seedExaminationInExamination');
	});
	after(() => cy.task('clearDb'));

	it('pauses and restarts case verifying the status in portal', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			manageToPortalLogin(TEST_EMAIL);

			openExaminationPage({ reference: plan.reference, planTitle: plan.title });
			pauseExamination();
			examinationPage.verifyNotificationBanner('Changes saved');
			examinationPage.verifyPaused();
			openCaseHistory();
			caseHistoryPage.verifyHistoryEvent('Plan paused');

			verifyPortalSubmissionHintText(plan.reference, 'Examination', 'Paused:');

			openExaminationPage({ reference: plan.reference, planTitle: plan.title });
			examinationPage.verifyPaused();
			restartExamination();
			examinationPage.verifyNotificationBanner('Changes saved');
			examinationPage.verifyRestarted();
			openCaseHistory();
			caseHistoryPage.verifyHistoryEvent('Plan restarted');

			verifyPortalSubmissionHintText(plan.reference, 'Examination', 'Submitted:');
		});
	});
});
