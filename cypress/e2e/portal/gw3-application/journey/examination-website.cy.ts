import { isEnvironmentSmoke } from '../../../../flows/auth-flow.ts';
import { portalLogin } from '../../../../flows/portal/login-flow.ts';
import { preparePlanDetails } from '../../../../flows/portal/plan-flow.ts';
import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';
import { gateway3ApplicationPage } from '../../../../page-objects/portal/gw3-application/gateway-3-application-page.ts';
import { examinationWebsitePage } from '../../../../page-objects/portal/gw3-application/examination-website-page.ts';
import { examinationWebsite } from '../../../../fixtures/portal/examination.ts';

describe('Gateway 3 examination website journeys', () => {
	let planDetails: PlanDetailsFixture;
	let portalSmokeCaseReference: string | undefined;

	beforeEach(() => {
		portalSmokeCaseReference = undefined;
		cy.task('clearDb');
		preparePlanDetails().then((plan) => {
			planDetails = plan;
			if (isEnvironmentSmoke()) {
				portalSmokeCaseReference = plan.reference;
			}
		});
		portalLogin();
	});

	afterEach(() => {
		if (portalSmokeCaseReference) {
			cy.task('softDeleteCaseByReference', portalSmokeCaseReference);
		}

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
