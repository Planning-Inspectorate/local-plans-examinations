import { portalLogin } from '../../../../flows/portal/login-flow.ts';
import { cleanupPreparedPlanDetails, preparePlanDetails } from '../../../../flows/portal/plan-flow.ts';
import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';
import { gateway3ApplicationPage } from '../../../../page-objects/portal/gw3-application/gateway-3-application-page.ts';
import { examinationWebsitePage } from '../../../../page-objects/portal/gw3-application/examination-website-page.ts';
import { examinationWebsite } from '../../../../fixtures/portal/examination.ts';

describe('Gateway 3 examination website journeys', () => {
	let planDetails: PlanDetailsFixture;

	beforeEach(() => {
		cy.task('clearDb');
		preparePlanDetails().then((plan) => {
			planDetails = plan;
		});
		portalLogin();
	});

	afterEach(() => {
		cleanupPreparedPlanDetails();
		cy.task('clearDb');
	});

	it('Adds an examination website and can then update and save the new value', { tags: ['regression'] }, () => {
		gateway3ApplicationPage.visit(planDetails.urlReference);
		gateway3ApplicationPage.verifyLoaded();
		gateway3ApplicationPage.clickAddLink(examinationWebsite.addCy);
		examinationWebsitePage.verifyLoaded();
		examinationWebsitePage.enterAnswer(examinationWebsite.value);
		gateway3ApplicationPage.verifyLoaded();
		gateway3ApplicationPage.verifyDocTableRows(gateway3ApplicationPage.requiredInformationTable, [
			{ document: examinationWebsite.row, status: examinationWebsite.value, addCy: examinationWebsite.addCy }
		]);
		gateway3ApplicationPage.clickAddLink(examinationWebsite.addCy);
		examinationWebsitePage.verifyLoaded(examinationWebsite.value);
		examinationWebsitePage.enterAnswer(examinationWebsite.updatedValue);
		gateway3ApplicationPage.verifyDocTableRows(gateway3ApplicationPage.requiredInformationTable, [
			{ document: examinationWebsite.row, status: examinationWebsite.updatedValue, addCy: examinationWebsite.addCy }
		]);
	});
});
