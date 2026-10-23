import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';
import { portalLogin } from '../../../../flows/portal/login-flow.ts';
import { examinationDeclarationPage } from '../../../../page-objects/portal/examination/declaration-page.ts';
import { examinationSubmissionCompletePage } from '../../../../page-objects/portal/examination/examination-submission-complete-page.ts';
import { planDetailsPage } from '../../../../page-objects/portal/plan-details/plan-details-page.ts';
import { openSeededExaminationDeclarationPage } from '../../../../flows/portal/examination-submission-flow.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');
const today = new Date();
const todayDisplay = today.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

describe('Examination Submission complete page journeys', () => {
	beforeEach(() => {
		cy.task('clearDb');
		portalLogin();
		loadPlanDetails().then((plan) => {
			openSeededExaminationDeclarationPage(plan);
		});
	});

	afterEach(() => {
		cy.task('clearDb');
	});

	it('Navigates to the plan details page', { tags: ['smoke'] }, () => {
		examinationDeclarationPage.confirmSubmissionButton.click();

		examinationSubmissionCompletePage.verifyLoaded();
		examinationSubmissionCompletePage.checkSubmissionStatusLink.click();

		planDetailsPage.verifyLoaded();
		planDetailsPage.verifyProgressRow('Examination', `Submitted: ${todayDisplay}`, 'Submitted');
	});
});
