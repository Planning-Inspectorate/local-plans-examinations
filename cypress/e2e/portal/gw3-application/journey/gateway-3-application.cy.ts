import { portalLogin, THIRD_TEST_EMAIL } from '../../../../flows/portal/login-flow.ts';
import { planDetailsPage } from '../../../../page-objects/portal/plan-details/plan-details-page.ts';
import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';
import { gateway3ApplicationPage } from '../../../../page-objects/portal/gw3-application/gateway-3-application-page.ts';
import { submitGateway3Application } from '../../../../flows/portal/gateway-3-submission-flow.ts';
import {
	mapOfProposedLocalPlanPoliciesPage,
	statementOfCompliancePage,
	proposedLocalPlanPage,
	statementOfSoundnessPage,
	consultationEngagementSummaryPage,
	scopingConsultationSummaryPage,
	consultationContentEvidenceSummaryPage,
	consultationProposedPlanSummaryPage,
	practicalArrangementsStatementPage
} from '../../../../page-objects/portal/gw3-application/gateway-3-uploads-page.ts';
import type { Gateway2ReportIssuedFixture } from '../../../../fixtures/portal/types.ts';
import { openGateway3ApplicationPage } from '../../../../flows/portal/plan-flow.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');

describe('Gateway 3 application page journeys', () => {
	beforeEach(() => {
		cy.task('clearDb');
		portalLogin();
	});

	after(() => cy.task('clearDb'));

	it('Navigates to Plan Details page when the Back link is clicked', { tags: ['smoke'] }, () => {
		loadPlanDetails().then((plan) => {
			gateway3ApplicationPage.visit(plan.urlReference);
			gateway3ApplicationPage.verifyLoaded();
			gateway3ApplicationPage.goBack();
			planDetailsPage.verifyPathForPlan(plan.urlReference);
		});
	});

	it('Navigates to Plan Details page when the Save and come back later link is clicked', { tags: ['smoke'] }, () => {
		loadPlanDetails().then((plan) => {
			gateway3ApplicationPage.visit(plan.urlReference);
			gateway3ApplicationPage.verifyLoaded();
			gateway3ApplicationPage.saveAndComeBackLink.click();
			planDetailsPage.verifyPathForPlan(plan.urlReference);
		});
	});

	it('Navigates to the declaration page after Gateway 3 is submitted', { tags: ['smoke'] }, () => {
		loadPlanDetails().then((plan) => {
			submitGateway3Application(
				plan,
				[
					{ page: proposedLocalPlanPage, fileNames: ['test-document.pdf'] },
					{ page: mapOfProposedLocalPlanPoliciesPage, fileNames: ['test-document.pdf'] },
					{ page: statementOfCompliancePage, fileNames: ['test-document.pdf'] },
					{ page: statementOfSoundnessPage, fileNames: ['test-document.pdf'] },
					{ page: consultationEngagementSummaryPage, fileNames: ['test-document.pdf'] },
					{ page: scopingConsultationSummaryPage, fileNames: ['test-document.pdf'] },
					{ page: consultationContentEvidenceSummaryPage, fileNames: ['test-document.pdf'] },
					{ page: consultationProposedPlanSummaryPage, fileNames: ['test-document.pdf'] },
					{ page: practicalArrangementsStatementPage, fileNames: ['test-document.pdf'] }
				],
				'https://testWebsite.com'
			);
		});
	});
});

const loadReportIssuedPlan = () => cy.fixture<Gateway2ReportIssuedFixture>('portal/gateway-2-report-issued.json');

describe('Gateway 3 application page journeys once Gateway 2 is submitted and its report issued', () => {
	beforeEach(() => {
		portalLogin(THIRD_TEST_EMAIL);
	});

	after(() => cy.task('clearDb'));

	it('Navigates to the Gateway 3 application page from the Plan Details page', { tags: ['smoke'] }, () => {
		loadReportIssuedPlan().then((plan) => {
			openGateway3ApplicationPage(plan);
		});
	});
});
