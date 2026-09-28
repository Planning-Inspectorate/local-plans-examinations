import type { PlanDetailsFixture } from '../../fixtures/portal/types.ts';
import { gateway3ApplicationPage } from '../../page-objects/portal/gw3-application/gateway-3-application-page.ts';
import type { DocumentUploadPage } from '../../page-objects/portal/base/document-upload-page.ts';
import { submitGateway2Application } from '../../flows/portal/gateway-2-submission-flow.ts';
import { gateway2CoverLetterPage } from '../../page-objects/portal/gw2-application/gateway-2-uploads.page.ts';

// TO DO: once the UI journey has been completed for Gateway 3, I will then update this flow to mirror openGateway2DocumentUploadPage
export const openGateway3DocumentUploadPage = (
	plan: Pick<PlanDetailsFixture, 'urlReference' | 'reference'>,
	page: DocumentUploadPage
) => {
	submitGateway2Application(plan, [{ page: gateway2CoverLetterPage, fileNames: ['test-document.pdf'] }]);
	gateway3ApplicationPage.visit(plan.urlReference);
	gateway3ApplicationPage.verifyLoaded();
	gateway3ApplicationPage.clickAddLink(page.addCy);
	page.verifyLoaded();
};
