import type { PlanDetailsFixture } from '../../fixtures/portal/types.ts';
import { openGateway2ApplicationPage } from './plan-flow.ts';
import { gateway2ApplicationPage } from '../../page-objects/portal/gw2-application/gateway-2-application-page.ts';
import { gateway2CoverLetterPage } from '../../page-objects/portal/gw2-application/gateway-2-uploads.page.ts';

export const openGateway2CoverLetterUploadPage = (plan: PlanDetailsFixture) => {
	openGateway2ApplicationPage(plan);
	gateway2ApplicationPage.clickAddLink('add-gateway-2-covering-letter');
	gateway2CoverLetterPage.verifyLoaded();
};
