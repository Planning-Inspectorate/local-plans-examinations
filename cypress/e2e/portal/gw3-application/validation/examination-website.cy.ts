import { portalLogin } from '../../../../flows/portal/login-flow.ts';
import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';
import { gateway3ApplicationPage } from '../../../../page-objects/portal/gw3-application/gateway-3-application-page.ts';
import { examinationWebsitePage } from '../../../../page-objects/portal/gw3-application/examination-website-page.ts';
import { examinationWebsite } from '../../../../fixtures/portal/examination.ts';
import { ERROR_MESSAGES } from '../../../../constants/portal/error-messages.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');

describe('Gateway 3 document upload validation tests', () => {
	beforeEach(() => {
		cy.task('clearDb');
		portalLogin();
	});

	after(() => cy.task('clearDb'));

	it('Shows error message when no examination website is entered', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			gateway3ApplicationPage.visit(plan.urlReference);
			gateway3ApplicationPage.verifyLoaded();
			gateway3ApplicationPage.clickAddLink(examinationWebsite.addCy);
			examinationWebsitePage.verifyLoaded();
			examinationWebsitePage.saveAndContinue();
			examinationWebsitePage.verifyValidationError(ERROR_MESSAGES.INVALID_EXAMINATION_WEBSITE_URL);
		});
	});

	it('Shows error message when invalid URL is entered', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			gateway3ApplicationPage.visit(plan.urlReference);
			gateway3ApplicationPage.verifyLoaded();
			gateway3ApplicationPage.clickAddLink(examinationWebsite.addCy);
			examinationWebsitePage.verifyLoaded();
			examinationWebsitePage.enterAnswer(examinationWebsite.invalidValue);
			examinationWebsitePage.verifyValidationError(ERROR_MESSAGES.INVALID_EXAMINATION_WEBSITE_URL);
		});
	});
});
