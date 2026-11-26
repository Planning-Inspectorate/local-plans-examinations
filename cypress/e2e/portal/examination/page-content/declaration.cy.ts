import { portalLogin } from '../../../../flows/portal/login-flow.ts';
import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';
import { examinationDeclarationPage } from '../../../../page-objects/portal/examination/declaration-page.ts';
import { examinationPage } from '../../../../page-objects/portal/examination/examination-application-page.ts';
import { openSeededExaminationDeclarationPage } from '../../../../flows/portal/examination-submission-flow.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');

describe('Examination Declaration page content', () => {
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

	it('Verify page content for Examination Declaration page', { tags: ['smoke'] }, () => {
		loadPlanDetails().then((plan) => {
			examinationDeclarationPage.verifyLoaded();
			examinationDeclarationPage.verifyServiceNavigation('Guidance', 'Sign out');
			examinationDeclarationPage.verifyBackLink(examinationPage.pathFor(plan.urlReference));
			examinationDeclarationPage.verifyConfirmSubmissionButton();
			examinationDeclarationPage.verifyGoBackButton();
		});
	});
});
