import { portalLogin } from '../../../../flows/portal/login-flow.ts';
import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';
import { examinationSubmissionCompletePage } from '../../../../page-objects/portal/examination/examination-submission-complete-page.ts';
import { examinationDeclarationPage } from '../../../../page-objects/portal/examination/declaration-page.ts';
import { openSeededExaminationDeclarationPage } from 'cypress/flows/portal/examination-submission-flow.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');

describe('Examination submission complete page content', () => {
	beforeEach(() => {
		cy.task('clearDb');
		portalLogin();
		loadPlanDetails().then((plan) => {
			openSeededExaminationDeclarationPage(plan);
			examinationDeclarationPage.confirmSubmissionButton.click();
		});
	});

	afterEach(() => {
		cy.task('clearDb');
	});

	it('Verify page content for Examination submission complete page', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			examinationSubmissionCompletePage.verifyPageContent(plan.urlReference);
		});
	});
});
