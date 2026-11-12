import { manageToPortalLogin, TEST_EMAIL } from '../../flows/portal/login-flow.ts';
import type { PlanDetailsFixture } from '../../fixtures/portal/types.ts';
import { openExaminationPage, uploadExaminationFinalReportDocuments } from '../../flows/manage/examination-flow.ts';
import { examinationReport } from '../../fixtures/manage/examination.ts';
import { verifyExaminationFinalReportDocumentsInPortal } from '../../flows/cross-service/examination-final-report-flow.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');
const todayDisplay = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

describe('Cross-service Examination final report document', () => {
	beforeEach(() => {
		cy.task('clearDb');
		cy.task('seedCase');
		cy.task('seedExaminationInExamination');
	});

	after(() => {
		cy.task('clearExaminationReportFiles', 'PLAN-001');
		cy.task('clearDb');
	});

	it(
		'Shows the Examination final report documents in Portal once they are submitted in Manage',
		{ tags: ['regression'] },
		() => {
			loadPlanDetails().then((plan) => {
				manageToPortalLogin(TEST_EMAIL);

				openExaminationPage({ reference: plan.reference, planTitle: plan.title });

				uploadExaminationFinalReportDocuments();

				verifyExaminationFinalReportDocumentsInPortal(
					plan.reference,
					[examinationReport.fileName, examinationReport.fileName2],
					todayDisplay
				);
			});
		}
	);
});
