import { portalLogin } from '../../../../flows/portal/login-flow.ts';
import { gateway3ResubmissionPage } from '../../../../page-objects/portal/gw3-application/gateway-3-resubmission-page.ts';
import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');

describe('Gateway 3 resubmission page content', () => {
	beforeEach(() => {
		portalLogin();
		cy.task('seedGateway3Resubmission');
	});

	after(() => cy.task('clearDb'));

	it('Shows the Gateway 3 resubmission data is displayed correctly', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			gateway3ResubmissionPage.visit(plan.urlReference);
			gateway3ResubmissionPage.verifyLoaded();
			gateway3ResubmissionPage.verifyServiceNavigation('Guidance', 'Sign out');
			gateway3ResubmissionPage.verifyBackLink(`/manage-local-plans/${plan.urlReference}`);
			gateway3ResubmissionPage.verifyCaption(plan.title);
			gateway3ResubmissionPage.verifyResubmissionTag();
			gateway3ResubmissionPage.verifyResubmissionData(gateway3ResubmissionPage.previousSubmissionTable, [
				['Submission 1 report', 'GW3Report-PLAN-001.pdf', '(shared on 15 October 2026)'],
				['Previous submissions', 'Submission 1', '(submitted on 1 October 2026)']
			]);
			gateway3ResubmissionPage.verifySaveAndComeBackLink(`/manage-local-plans/${plan.urlReference}`);
			gateway3ResubmissionPage.verifySubHeading('New or updated documents');
			gateway3ResubmissionPage.verifyMainContains(
				'Add any new documents or updated documents that are relevant to your resubmission as outlined in the report.'
			);
			gateway3ResubmissionPage.verifyDocTableRows(gateway3ResubmissionPage.newDocumentsTable, [
				{ document: 'Documents', status: 'Not added', addCy: 'add-documents' }
			]);
			gateway3ResubmissionPage.verifySubmitButton();
		});
	});
});
