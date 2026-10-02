import { portalLogin } from '../../../../flows/portal/login-flow.ts';
import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';
import { gateway3DeclarationPage } from '../../../../page-objects/portal/gw3-application/declaration-page.ts';
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

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');

describe('Gateway 3 Submission page journeys', () => {
	beforeEach(() => {
		cy.task('clearDb');
		portalLogin();
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

	afterEach(() => {
		cy.task('clearDb');
	});

	it('Verifying page content for the gateway 3 submission page', { tags: ['smoke'] }, () => {
		loadPlanDetails().then((plan) => {
			gateway3DeclarationPage.verifyLoaded();
			gateway3DeclarationPage.verifyServiceNavigation('Guidance', 'Sign out');
			gateway3DeclarationPage.verifyBackLink(gateway3ApplicationPage.pathFor(plan.urlReference));
			gateway3DeclarationPage.verifyConfirmSubmissionButton();
			gateway3DeclarationPage.verifyGoBackButton();
		});
	});
});
