import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';
import { portalLogin } from '../../../../flows/portal/login-flow.ts';
import {
	mapOfPropsedLocalPlanPoliciesPage,
	statementOfCompliancePage
} from '../../../../page-objects/portal/gw3-application/gateway-3-uploads-page.ts';
import { gateway3ApplicationPage } from '../../../../page-objects/portal/gw3-application/gateway-3-application-page.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');

describe('Gateway 3 document upload page content', () => {
	beforeEach(() => {
		portalLogin();
		loadPlanDetails().then((plan) => {
			gateway3ApplicationPage.visit(plan.urlReference);
			gateway3ApplicationPage.verifyLoaded();
		});
	});

	it('Verify the page content for the map of proposed local plan policies page', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			gateway3ApplicationPage.clickAddLink(mapOfPropsedLocalPlanPoliciesPage.addCy);
			mapOfPropsedLocalPlanPoliciesPage.verifyLoaded();
			mapOfPropsedLocalPlanPoliciesPage.verifyBackLink(gateway3ApplicationPage.pathFor(plan.urlReference));
			mapOfPropsedLocalPlanPoliciesPage.verifyServiceNavigation('Guidance', 'Sign out');
			mapOfPropsedLocalPlanPoliciesPage.verifyCaptionL('Required information');
			mapOfPropsedLocalPlanPoliciesPage.verifyMainContains('Drag and drop or choose files');
			mapOfPropsedLocalPlanPoliciesPage.verifyNoFileChosen();
			mapOfPropsedLocalPlanPoliciesPage.verifyUploadFormVisible();
			mapOfPropsedLocalPlanPoliciesPage.verifyFileFormatHintText(
				'Each file must be a PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, MSG, JPG, JPEG, PNG, TIF or TIFF and smaller than 250MB. The total size of your uploaded files must be smaller than 1GB.'
			);
			mapOfPropsedLocalPlanPoliciesPage.verifyUploadFilesButtonVisible();
			mapOfPropsedLocalPlanPoliciesPage.verifySaveAndReturnButton();
		});
	});

	it('Verify the page content for the statement of compliance page', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			gateway3ApplicationPage.clickAddLink(statementOfCompliancePage.addCy);
			statementOfCompliancePage.verifyLoaded();
			statementOfCompliancePage.verifyBackLink(gateway3ApplicationPage.pathFor(plan.urlReference));
			statementOfCompliancePage.verifyServiceNavigation('Guidance', 'Sign out');
			statementOfCompliancePage.verifyCaptionL('Required information');
			statementOfCompliancePage.verifyMainContains('Drag and drop or choose files');
			statementOfCompliancePage.verifyNoFileChosen();
			statementOfCompliancePage.verifyUploadFormVisible();
			statementOfCompliancePage.verifyFileFormatHintText(
				'Each file must be a PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, MSG, JPG, JPEG, PNG, TIF or TIFF and smaller than 250MB. The total size of your uploaded files must be smaller than 1GB.'
			);
			statementOfCompliancePage.verifyUploadFilesButtonVisible();
			statementOfCompliancePage.verifySaveAndReturnButton();
		});
	});
});
