import { openGateway2CoverLetterUploadPage } from '../../../../flows/portal/gateway-2-upload-flow.ts';
import { portalLogin } from '../../../../flows/portal/login-flow.ts';
import { gateway2ApplicationPage } from '../../../../page-objects/portal/gw2-application/gateway-2-application-page.ts';
import { gateway2CoverLetterPage } from '../../../../page-objects/portal/gw2-application/gateway-2-uploads.page.ts';
import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');

describe('Gateway 2 document upload page content', () => {
	beforeEach(() => {
		portalLogin();
	});

	it('Verifying page content for the covering letter upload page', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			openGateway2CoverLetterUploadPage(plan);
			gateway2CoverLetterPage.verifyLoaded();
			gateway2CoverLetterPage.verifyBackLink(gateway2ApplicationPage.pathFor(plan.urlReference));
			gateway2CoverLetterPage.verifyServiceNavigation('Guidance', 'Account settings', 'Manage users');
			gateway2CoverLetterPage.verifyMainContains('Drag and drop or choose files');
			gateway2CoverLetterPage.verifyNoFileChosen();
			gateway2CoverLetterPage.verifyUploadFormVisible();
			gateway2CoverLetterPage.verifyFileFormatHintText();
			gateway2CoverLetterPage.verifyUploadFilesButtonVisible();
			gateway2CoverLetterPage.verifySaveAndReturnButton();
		});
	});
});
