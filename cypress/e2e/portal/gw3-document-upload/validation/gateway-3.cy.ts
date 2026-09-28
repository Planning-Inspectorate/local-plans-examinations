import { openGateway3DocumentUploadPage } from '../../../../flows/portal/gateway-3-upload-flow.ts';
import { portalLogin } from '../../../../flows/portal/login-flow.ts';
import {
	mapOfProposedLocalPlanPoliciesPage,
	environmentalReportPage
} from '../../../../page-objects/portal/gw3-application/gateway-3-uploads-page.ts';
import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';

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
				const page = mapOfProposedLocalPlanPoliciesPage;
				openGateway3DocumentUploadPage(plan, page);
				page.verifyInvalidFileTypeError();
			});
		}
	);

	it(
		'Shows error message when no file is uploaded to the map of proposed local plan policies',
		{ tags: ['regression'] },
		() => {
			loadPlanDetails().then((plan) => {
				const page = mapOfProposedLocalPlanPoliciesPage;
				openGateway3DocumentUploadPage(plan, page);
				page.verifyNoFileUploadedError();
			});
		}
	);

	it('Shows error message when the environmental report file type is not allowed', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			const page = environmentalReportPage;
			openGateway3DocumentUploadPage(plan, page);
			page.verifyInvalidFileTypeError();
		});
	});

	it('Shows error message when no file is uploaded to the environmental report', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			const page = environmentalReportPage;
			openGateway3DocumentUploadPage(plan, page);
			page.verifyNoFileUploadedError();
		});
	});
});
