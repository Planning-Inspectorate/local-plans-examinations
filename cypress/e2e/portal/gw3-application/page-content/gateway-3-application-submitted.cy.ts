import { portalLogin } from '../../../../flows/portal/login-flow.ts';
import { gateway3ApplicationPage } from '../../../../page-objects/portal/gw3-application/gateway-3-application-page.ts';
import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';
import { openSeededGateway3Submission } from '../../../../flows/portal/gateway-3-submission-flow.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');
const today = new Date();
const todayDisplay = today.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

describe('Gateway 3 application page content after submission', () => {
	beforeEach(() => {
		portalLogin();
	});

	after(() => cy.task('clearDb'));

	it('Shows the Gateway 3 submission data has been recorded correctly', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			openSeededGateway3Submission(plan);

			gateway3ApplicationPage.visit(plan.urlReference);
			gateway3ApplicationPage.verifyLoaded();

			gateway3ApplicationPage.verifySubmissionData(todayDisplay, 'test@planninginspectorate.gov.uk');

			gateway3ApplicationPage.verifyDocumentRowContains(
				gateway3ApplicationPage.requiredInformationTable,
				'Map of proposed local plan policies',
				'g3-map-of-policies.pdf'
			);

			gateway3ApplicationPage.verifyDocumentRowContains(
				gateway3ApplicationPage.requiredInformationTable,
				'Statement of Compliance',
				'g3-stat-compliance.pdf'
			);

			gateway3ApplicationPage.verifyNoAddOrChangeLinks();
			gateway3ApplicationPage.verifySubmitGateway3ButtonNotShown();
		});
	});
});
