import { portalLogin } from '../../../../flows/portal/login-flow.ts';
import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';
import { examinationPage } from '../../../../page-objects/portal/examination/examination-application-page.ts';
import { ERROR_MESSAGES } from '../../../../constants/portal/error-messages.ts';
import { examinationSubmissionWebsitePage } from '../../../../page-objects/portal/examination/examination-website-page.ts';
import { examinationSubmissionWebsite } from '../../../../fixtures/portal/examination-website.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');

describe('Examination website validation tests', () => {
	beforeEach(() => {
		cy.task('clearDb');
		portalLogin();
		cy.task('seedExaminationReadyToStart');
	});

	after(() => cy.task('clearDb'));

	it('Shows error message when no examination website is entered', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			examinationPage.visit(plan.urlReference);
			examinationPage.verifyLoaded();
			examinationPage.clickAddLink(examinationSubmissionWebsite.addCy);
			examinationSubmissionWebsitePage.verifyLoaded();
			examinationSubmissionWebsitePage.answerInput.clear();
			examinationSubmissionWebsitePage.saveAndContinue();
			examinationSubmissionWebsitePage.verifyValidationError(ERROR_MESSAGES.INVALID_EXAMINATION_WEBSITE_URL);
		});
	});

	it('Shows error message when invalid URL is entered', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			examinationPage.visit(plan.urlReference);
			examinationPage.verifyLoaded();
			examinationPage.clickAddLink(examinationSubmissionWebsite.addCy);
			examinationSubmissionWebsitePage.verifyLoaded();
			examinationSubmissionWebsitePage.enterAnswer(examinationSubmissionWebsite.invalidValue);
			examinationSubmissionWebsitePage.verifyValidationError(ERROR_MESSAGES.INVALID_EXAMINATION_WEBSITE_URL);
		});
	});
});
