import { isEnvironmentSmoke } from '../../../../flows/auth-flow.ts';
import { portalLogin } from '../../../../flows/portal/login-flow.ts';
import { preparePlanDetails } from '../../../../flows/portal/plan-flow.ts';
import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';
import { gateway3ApplicationPage } from '../../../../page-objects/portal/gw3-application/gateway-3-application-page.ts';
import {
	mapOfProposedLocalPlanPoliciesPage,
	statementOfCompliancePage
} from '../../../../page-objects/portal/gw3-application/gateway-3-uploads-page.ts';
import { openGateway3DocumentUploadPage } from '../../../../flows/portal/gateway-3-upload-flow.ts';

describe('Gateway 3 document upload journeys', () => {
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

	it(
		'Adds a map of proposed local plan policies using drag and drop, then replaces it with new document',
		{ tags: ['regression'] },
		() => {
			const page = mapOfProposedLocalPlanPoliciesPage;
			openGateway3DocumentUploadPage(planDetails, page);
			mapOfProposedLocalPlanPoliciesPage.dragAndDropFile('test-document.pdf');
			mapOfProposedLocalPlanPoliciesPage.clickUploadFiles();
			mapOfProposedLocalPlanPoliciesPage.verifyFileUploaded('test-document.pdf');

			mapOfProposedLocalPlanPoliciesPage.goBack();
			gateway3ApplicationPage.verifyLoaded();

			gateway3ApplicationPage.clickAddLink(page.addCy);
			mapOfProposedLocalPlanPoliciesPage.verifyLoaded();
			mapOfProposedLocalPlanPoliciesPage.verifyFileUploaded('test-document.pdf');

			mapOfProposedLocalPlanPoliciesPage.removeFile('test-document.pdf');
			mapOfProposedLocalPlanPoliciesPage.verifyFileNotUploaded('test-document.pdf');

			mapOfProposedLocalPlanPoliciesPage.uploadAndVerifyFile('test-document.docx');
		}
	);

	it(
		'Shows both uploaded statement of compliance files on the Gateway 3 submission page',
		{ tags: ['regression', 'environment-smoke'] },
		() => {
			const page = statementOfCompliancePage;
			openGateway3DocumentUploadPage(planDetails, page);
			statementOfCompliancePage.uploadAndVerifyFile('test-document.pdf');

			statementOfCompliancePage.uploadAndVerifyFile('test-document.docx');

			statementOfCompliancePage.saveAndReturn();
			gateway3ApplicationPage.verifyLoaded();

			gateway3ApplicationPage.verifyDocumentRowContains(
				gateway3ApplicationPage.requiredInformationTable,
				'Statement of Compliance',
				'test-document.pdf',
				'test-document.docx'
			);
		}
	);

	it(
		'Downloads statement of compliance file when document link is clicked',
		{ tags: ['regression', 'environment-smoke'] },
		() => {
			const page = statementOfCompliancePage;
			openGateway3DocumentUploadPage(planDetails, page);
			statementOfCompliancePage.uploadAndVerifyFile('test-document.pdf');

			statementOfCompliancePage.saveAndReturn();
			gateway3ApplicationPage.verifyLoaded();

			gateway3ApplicationPage.verifyDocumentDownloadLink(
				gateway3ApplicationPage.requiredInformationTable,
				'Statement of Compliance',
				'test-document.pdf'
			);
		}
	);
});
