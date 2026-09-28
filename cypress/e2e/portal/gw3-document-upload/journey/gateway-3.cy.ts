import { isEnvironmentSmoke } from '../../../../flows/auth-flow.ts';
import { portalLogin } from '../../../../flows/portal/login-flow.ts';
import { preparePlanDetails } from '../../../../flows/portal/plan-flow.ts';
import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';
import { gateway3ApplicationPage } from '../../../../page-objects/portal/gw3-application/gateway-3-application-page.ts';
import {
	mapOfProposedLocalPlanPoliciesPage,
	statementOfCompliancePage,
	environmentalReportPage
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
			page.dragAndDropAndVerifyFile('test-document.pdf');
			page.verifyReplaceFile(gateway3ApplicationPage, 'test-document.pdf', 'test-document.docx', 'goBack');
		}
	);

	it(
		'Shows both uploaded statement of compliance files on the Gateway 3 submission page',
		{ tags: ['regression', 'environment-smoke'] },
		() => {
			const page = statementOfCompliancePage;
			openGateway3DocumentUploadPage(planDetails, page);
			page.uploadAndVerifyFiles(['test-document.pdf', 'test-document.docx']);
			page.saveAndVerifyDocumentRow(
				gateway3ApplicationPage,
				() => gateway3ApplicationPage.requiredInformationTable,
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
			page.uploadAndVerifyFile('test-document.docx');
			page.saveAndVerifyDownloadLink(
				gateway3ApplicationPage,
				() => gateway3ApplicationPage.requiredInformationTable,
				'Statement of Compliance',
				'test-document.docx'
			);
		}
	);

	it(
		'Adds an environmental report using drag and drop, then replaces it with new document',
		{ tags: ['regression'] },
		() => {
			const page = environmentalReportPage;
			openGateway3DocumentUploadPage(planDetails, page);
			page.dragAndDropAndVerifyFile('test-document.pdf');
			page.verifyReplaceFile(gateway3ApplicationPage, 'test-document.pdf', 'test-document.docx', 'goBack');
		}
	);

	it(
		'Shows both uploaded environmental report files on the Gateway 3 submission page',
		{ tags: ['regression', 'environment-smoke'] },
		() => {
			const page = environmentalReportPage;
			openGateway3DocumentUploadPage(planDetails, page);
			page.uploadAndVerifyFiles(['test-document.pdf', 'test-document.docx']);
			page.saveAndVerifyDocumentRow(
				gateway3ApplicationPage,
				() => gateway3ApplicationPage.optionalDocumentsTable,
				'Environmental report',
				'test-document.pdf',
				'test-document.docx'
			);
		}
	);

	it('Downloads environmental report file when document link is clicked', { tags: ['regression'] }, () => {
		const page = environmentalReportPage;
		openGateway3DocumentUploadPage(planDetails, page);
		page.uploadAndVerifyFile('test-document.pdf');
		page.saveAndVerifyDownloadLink(
			gateway3ApplicationPage,
			() => gateway3ApplicationPage.optionalDocumentsTable,
			'Environmental report',
			'test-document.pdf'
		);
	});
});
