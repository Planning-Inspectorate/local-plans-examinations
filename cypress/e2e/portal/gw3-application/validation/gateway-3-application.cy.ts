import { portalLogin } from '../../../../flows/portal/login-flow.ts';
import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';
import { gateway3ApplicationPage } from '../../../../page-objects/portal/gw3-application/gateway-3-application-page.ts';
import { ERROR_MESSAGES } from '../../../../constants/portal/error-messages.ts';
import {
	mapOfProposedLocalPlanPoliciesPage,
	statementOfCompliancePage
} from '../../../../page-objects/portal/gw3-application/gateway-3-uploads-page.ts';
import type { DocumentUploadPage } from '../../../../page-objects/portal/base/document-upload-page.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');
const addRequiredDocuments = (page: DocumentUploadPage, fileName: string) => {
	gateway3ApplicationPage.clickAddLink(page.addCy);
	page.dragAndDropAndVerifyFile(fileName);
	page.saveAndReturn();
};

describe('Gateway 3 document upload validation tests', () => {
	beforeEach(() => {
		cy.task('clearDb');
		portalLogin();
		loadPlanDetails().then((plan) => {
			gateway3ApplicationPage.visit(plan.urlReference);
			gateway3ApplicationPage.verifyLoaded();
		});
	});

	after(() => cy.task('clearDb'));

	it(
		'Shows error message when Submit is clicked and no required documents have been added',
		{ tags: ['regression'] },
		() => {
			gateway3ApplicationPage.submitGateway3Button.click();
			gateway3ApplicationPage.verifyErrorSummary(
				ERROR_MESSAGES.THERE_IS_A_PROBLEM,
				ERROR_MESSAGES.ADD_ALL_REQUIRED_DOCUMENTS
			);
		}
	);

	it(
		'Shows error message when Submit is clicked and not all required documents have been added',
		{ tags: ['regression'] },
		() => {
			addRequiredDocuments(mapOfProposedLocalPlanPoliciesPage, 'test-document.pdf');
			addRequiredDocuments(statementOfCompliancePage, 'test-document.xlsx');
			gateway3ApplicationPage.submitGateway3Button.click();
			gateway3ApplicationPage.verifyErrorSummary(
				ERROR_MESSAGES.THERE_IS_A_PROBLEM,
				ERROR_MESSAGES.ADD_ALL_REQUIRED_DOCUMENTS
			);
		}
	);
});
