import { manageToPortalLogin, TEST_EMAIL } from '../../flows/portal/login-flow.ts';
import { uploadExaminationMIQDocuments, openExaminationPage } from '../../flows/manage/examination-flow.ts';
import { verifyExaminationMIQDocumentsInPortal } from '../../flows/cross-service/examination-miq-documents-flow.ts';
import type { PlanDetailsFixture } from '../../fixtures/portal/types.ts';
import { MIQcheckPage } from '../../fixtures/manage/examination.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');
const todayDisplay = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

describe('Cross-service Examination MIQ documents', () => {
	beforeEach(() => {
		cy.task('clearDb');
		cy.task('seedCase');
		cy.task('seedExaminationInExamination');
	});

	after(() => cy.task('clearDb'));

	it(
		'Shows the Examination MIQ documents in Portal once they are submitted in Manage',
		{ tags: ['regression'] },
		() => {
			loadPlanDetails().then((plan) => {
				manageToPortalLogin(TEST_EMAIL);

				openExaminationPage({ reference: plan.reference, planTitle: plan.title });

				uploadExaminationMIQDocuments();

				verifyExaminationMIQDocumentsInPortal(plan.reference, [MIQcheckPage.file1, MIQcheckPage.file2], todayDisplay);
			});
		}
	);
});
