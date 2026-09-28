import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';
import { portalLogin } from '../../../../flows/portal/login-flow.ts';
import {
	mapOfProposedLocalPlanPoliciesPage,
	statementOfCompliancePage,
	environmentalReportPage
} from '../../../../page-objects/portal/gw3-application/gateway-3-uploads-page.ts';
import { gateway3ApplicationPage } from '../../../../page-objects/portal/gw3-application/gateway-3-application-page.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');

describe('Gateway 3 document upload page content', () => {
	beforeEach(() => {
		portalLogin();
		loadPlanDetails().then((plan) => {
			gateway3ApplicationPage.visit(plan.urlReference);
			gateway3ApplicationPage.verifyLoaded();
		});
	});

	it('Verify the page content for the map of proposed local plan policies page', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			gateway3ApplicationPage.clickAddLink(mapOfProposedLocalPlanPoliciesPage.addCy);
			mapOfProposedLocalPlanPoliciesPage.verifyPageContent(gateway3ApplicationPage.pathFor(plan.urlReference));
		});
	});

	it('Verify the page content for the statement of compliance page', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			gateway3ApplicationPage.clickAddLink(statementOfCompliancePage.addCy);
			statementOfCompliancePage.verifyPageContent(gateway3ApplicationPage.pathFor(plan.urlReference));
		});
	});

	it('Verify the page content for the environmental report page', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			gateway3ApplicationPage.clickAddLink(environmentalReportPage.addCy);
			environmentalReportPage.verifyPageContent(gateway3ApplicationPage.pathFor(plan.urlReference));
		});
	});
});
