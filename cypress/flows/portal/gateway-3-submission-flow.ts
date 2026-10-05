import type { PlanDetailsFixture } from '../../fixtures/portal/types.ts';
import { gateway3ApplicationPage } from '../../page-objects/portal/gw3-application/gateway-3-application-page.ts';
import { examinationWebsitePage } from '../../page-objects/portal/gw3-application/examination-website-page.ts';
import type { DocumentUploadPage } from '../../page-objects/portal/base/document-upload-page.ts';
import { gateway3DeclarationPage } from '../../page-objects/portal/gw3-application/declaration-page.ts';
import { examinationWebsite } from '../../fixtures/portal/examination.ts';

export type Gateway3DocumentUpload = {
	page: DocumentUploadPage;
	fileNames: string[];
};

export const submitGateway3Application = (
	plan: Pick<PlanDetailsFixture, 'urlReference'>,
	uploads: Gateway3DocumentUpload[],
	examinationWebsiteUrl: string
) => {
	gateway3ApplicationPage.visit(plan.urlReference);
	gateway3ApplicationPage.verifyLoaded();

	gateway3ApplicationPage.clickAddLink(examinationWebsitePage.addCy);
	examinationWebsitePage.verifyLoaded();
	examinationWebsitePage.enterAnswer(examinationWebsiteUrl);
	gateway3ApplicationPage.verifyLoaded();

	uploads.forEach(({ page, fileNames }) => {
		gateway3ApplicationPage.clickAddLink(page.addCy);
		page.verifyLoaded();
		page.uploadAndVerifyFiles(fileNames);
		page.saveAndReturn();
		gateway3ApplicationPage.verifyLoaded();
	});

	gateway3ApplicationPage.submitGateway3Button.click();
	gateway3DeclarationPage.verifyLoaded();
};

export const openSeededGateway3DeclarationPage = (plan: Pick<PlanDetailsFixture, 'urlReference'>) => {
	cy.task('seedGateway3DeclarationDocuments');
	gateway3ApplicationPage.visit(plan.urlReference);
	gateway3ApplicationPage.verifyLoaded();
	gateway3ApplicationPage.clickAddLink(examinationWebsitePage.addCy);
	examinationWebsitePage.verifyLoaded();
	examinationWebsitePage.enterAnswer(examinationWebsite.value);
	gateway3ApplicationPage.verifyLoaded();
	gateway3ApplicationPage.submitGateway3Button.click();
	gateway3DeclarationPage.verifyLoaded();
};
