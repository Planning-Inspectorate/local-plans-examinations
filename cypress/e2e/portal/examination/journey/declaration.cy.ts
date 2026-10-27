import { portalLogin } from '../../../../flows/portal/login-flow.ts';
import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';
import { examinationDeclarationPage } from '../../../../page-objects/portal/examination/declaration-page.ts';
import { examinationSubmissionCompletePage } from '../../../../page-objects/portal/examination/examination-submission-complete-page.ts';
import { examinationPage } from '../../../../page-objects/portal/examination/examination-application-page.ts';
import { openSeededExaminationDeclarationPage } from '../../../../flows/portal/examination-submission-flow.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');

describe('Examination Declaration page journeys', () => {
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

	it('Navigates to Examination submission when back link is clicked', { tags: ['smoke'] }, () => {
		loadPlanDetails().then((plan) => {
			examinationDeclarationPage.verifyLoaded();

			examinationDeclarationPage.goBack();
			examinationPage.verifyPathForPlan(plan.urlReference);
		});
	});

	it(
		'Navigates to Examination submission complete page when confirm submission is clicked',
		{ tags: ['smoke'] },
		() => {
			loadPlanDetails().then((plan) => {
				examinationDeclarationPage.verifyLoaded();

				examinationDeclarationPage.confirmSubmissionButton.click();
				examinationSubmissionCompletePage.verifyPathForPlan(plan.urlReference);
			});
		}
	);
});
