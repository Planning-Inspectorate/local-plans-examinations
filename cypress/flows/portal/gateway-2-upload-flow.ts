import type { PlanDetailsFixture } from '../../fixtures/portal/types.ts';
import { openGateway2ApplicationPage } from './plan-flow.ts';
import { gateway2ApplicationPage } from '../../page-objects/portal/gw2-application/gateway-2-application-page.ts';
import type { DocumentUploadPage } from 'cypress/page-objects/portal/base/document-upload-page.ts';

export const openGateway2DocumentUploadPage = (plan: PlanDetailsFixture, page: DocumentUploadPage) => {
	openGateway2ApplicationPage(plan);
	gateway2ApplicationPage.clickAddLink(page.addCy);
	page.verifyLoaded();
};
