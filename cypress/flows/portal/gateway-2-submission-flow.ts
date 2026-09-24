import type { PlanDetailsFixture } from '../../fixtures/portal/types.ts';
import { gateway2ApplicationPage } from '../../page-objects/portal/gw2-application/gateway-2-application-page.ts';
import { openGateway2DocumentUploadPage } from '../../flows/portal/gateway-2-upload-flow.ts';
import { portalDeclarationPage } from '../../page-objects/portal/gw2-application/declaration-page.ts';
import { applicationCompletePage } from '../../page-objects/portal/gw2-application/application-complete-page.ts';
import type { DocumentUploadPage } from '../../page-objects/portal/base/document-upload-page.ts';

export type Gateway2DocumentUpload = {
	page: DocumentUploadPage;
	fileNames: string[];
};

export const submitGateway2Application = (
	plan: Pick<PlanDetailsFixture, 'reference'>,
	uploads: Gateway2DocumentUpload[]
) => {
	uploads.forEach(({ page, fileNames }, index) => {
		if (index === 0) {
			openGateway2DocumentUploadPage(plan, page);
		} else {
			gateway2ApplicationPage.clickAddLink(page.addCy);
			page.verifyLoaded();
		}

		page.uploadFile(fileNames);
		page.clickUploadFiles();
		page.saveAndReturn();
		gateway2ApplicationPage.verifyLoaded();
	});

	gateway2ApplicationPage.submitGateway2AssessmentButton.click();

	portalDeclarationPage.verifyLoaded();
	portalDeclarationPage.confirmInformationCheckbox.click();
	portalDeclarationPage.privacyNoteCheckbox.click();
	portalDeclarationPage.confirmAndSubmitButton.click();

	applicationCompletePage.verifyLoaded();
};
