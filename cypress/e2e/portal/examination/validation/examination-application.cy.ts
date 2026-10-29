import { portalLogin } from '../../../../flows/portal/login-flow.ts';
import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';
import { examinationPage } from '../../../../page-objects/portal/examination/examination-application-page.ts';
import { ERROR_MESSAGES } from '../../../../constants/portal/error-messages.ts';
import {
	mapOfProposedLocalPlanPoliciesPage,
	statementOfCompliancePage
} from '../../../../page-objects/portal/examination/examination-uploads-page.ts';
import type { DocumentUploadPage } from '../../../../page-objects/portal/base/document-upload-page.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');
const addRequiredDocuments = (page: DocumentUploadPage, fileName: string) => {
	examinationPage.clickAddLink(page.addCy);
	page.dragAndDropAndVerifyFile(fileName);
	page.saveAndReturn();
};

describe('Examination document upload validation tests', () => {
	beforeEach(() => {
		cy.task('clearDb');
		portalLogin();
		cy.task('seedExaminationReadyToStart');
		loadPlanDetails().then((plan) => {
			examinationPage.visit(plan.urlReference);
			examinationPage.verifyLoaded();
		});
	});

	after(() => cy.task('clearDb'));

	it(
		'Shows error message when Submit is clicked and no required documents have been added',
		{ tags: ['regression'] },
		() => {
			examinationPage.submitExaminationButton.click();
			examinationPage.verifyErrorSummary(
				ERROR_MESSAGES.THERE_IS_A_PROBLEM,
				ERROR_MESSAGES.ADD_ALL_REQUIRED_EXAMINATION_DOCUMENTS
			);
		}
	);

	it(
		'Shows error message when Submit is clicked and not all required documents have been added',
		{ tags: ['regression'] },
		() => {
			addRequiredDocuments(mapOfProposedLocalPlanPoliciesPage, 'test-document.pdf');
			addRequiredDocuments(statementOfCompliancePage, 'test-document.xlsx');
			examinationPage.submitExaminationButton.click();
			examinationPage.verifyErrorSummary(
				ERROR_MESSAGES.THERE_IS_A_PROBLEM,
				ERROR_MESSAGES.ADD_ALL_REQUIRED_EXAMINATION_DOCUMENTS
			);
		}
	);
});
