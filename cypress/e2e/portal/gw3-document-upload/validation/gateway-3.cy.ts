import { openGateway3DocumentUploadPage } from '../../../../flows/portal/gateway-3-upload-flow.ts';
import { portalLogin } from '../../../../flows/portal/login-flow.ts';
import { mapOfPropsedLocalPlanPoliciesPage } from '../../../../page-objects/portal/gw3-application/gateway-3-uploads-page.ts';
import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';
import { ERROR_MESSAGES } from '../../../../constants/portal/error-messages.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');

describe('Gateway 3 document upload validation tests', () => {
	beforeEach(() => {
		cy.task('clearDb');
		portalLogin();
	});

	after(() => cy.task('clearDb'));

	it(
		'Shows error message when the map of proposed local plan policies file type is not allowed',
		{ tags: ['regression'] },
		() => {
			loadPlanDetails().then((plan) => {
				const page = mapOfPropsedLocalPlanPoliciesPage;
				openGateway3DocumentUploadPage(plan, page);
				mapOfPropsedLocalPlanPoliciesPage.uploadFile('test-document-invalid.txt');
				mapOfPropsedLocalPlanPoliciesPage.clickUploadFiles();
				mapOfPropsedLocalPlanPoliciesPage.verifyErrorSummary(
					ERROR_MESSAGES.THERE_IS_A_PROBLEM,
					ERROR_MESSAGES.INVALID_FILE_FORMAT
				);
			});
		}
	);

	it(
		'Shows error message when no file is uploaded to the map of proposed local plan policies',
		{ tags: ['regression'] },
		() => {
			loadPlanDetails().then((plan) => {
				const page = mapOfPropsedLocalPlanPoliciesPage;
				openGateway3DocumentUploadPage(plan, page);
				mapOfPropsedLocalPlanPoliciesPage.clickUploadFiles();
				mapOfPropsedLocalPlanPoliciesPage.verifyErrorSummary(
					ERROR_MESSAGES.THERE_IS_A_PROBLEM,
					ERROR_MESSAGES.NO_FILE_UPLOADED
				);
			});
		}
	);
});
