import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';
import { examinationSubmissionWebsitePage } from '../../../../page-objects/portal/examination/examination-website-page.ts';
import { portalLogin } from '../../../../flows/portal/login-flow.ts';
import { examinationPage } from '../../../../page-objects/portal/examination/examination-application-page.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');

describe('Examination website page content', () => {
	beforeEach(() => {
		cy.task('clearDb');
		portalLogin();
		cy.task('seedExaminationReadyToStart');
		loadPlanDetails().then((plan) => {
			examinationPage.visit(plan.urlReference);
			examinationPage.verifyLoaded();
		});
	});

	after(() => cy.task('clearDb'));

	it('Verify page content for examination website page', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			examinationSubmissionWebsitePage.clickAddLink(examinationSubmissionWebsitePage.addCy);
			examinationSubmissionWebsitePage.verifyLoaded(examinationSubmissionWebsitePage.value);
			examinationSubmissionWebsitePage.verifyBackLink(examinationPage.pathFor(plan.urlReference));
			examinationSubmissionWebsitePage.verifyServiceNavigation('Guidance', 'Sign out');
			examinationSubmissionWebsitePage.verifySaveAndReturnButton();
		});
	});
});
