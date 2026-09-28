import { openGateway2DocumentUploadPage } from '../../../../flows/portal/gateway-2-upload-flow.ts';
import { portalLogin } from '../../../../flows/portal/login-flow.ts';
import { gateway2ApplicationPage } from '../../../../page-objects/portal/gw2-application/gateway-2-application-page.ts';
import {
	gateway2CoverLetterPage,
	localPlanTimetablePage,
	noticeOfIntentionToCommenceLocalPlanPage,
	subsequentWorkTowardsDraftPlanPage
} from '../../../../page-objects/portal/gw2-application/gateway-2-uploads.page.ts';
import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');

describe('Gateway 2 document upload page content', () => {
	beforeEach(() => {
		portalLogin();
	});

	it('Verifying page content for the covering letter upload page', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			const page = gateway2CoverLetterPage;
			openGateway2DocumentUploadPage(plan, page);
			page.verifyPageContent(gateway2ApplicationPage.pathFor(plan.urlReference));
		});
	});

	it('Verifying page content for the local plan timetable upload page', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			const page = localPlanTimetablePage;
			openGateway2DocumentUploadPage(plan, page);
			page.verifyPageContent(gateway2ApplicationPage.pathFor(plan.urlReference));
		});
	});

	it('Verifying page content for the notice of intention to commence local plan', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			const page = noticeOfIntentionToCommenceLocalPlanPage;
			openGateway2DocumentUploadPage(plan, page);
			page.verifyPageContent(gateway2ApplicationPage.pathFor(plan.urlReference));
		});
	});

	it('Verifying page content for the subsequent work towards a draft plan', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			const page = subsequentWorkTowardsDraftPlanPage;
			openGateway2DocumentUploadPage(plan, page);
			page.verifyPageContent(gateway2ApplicationPage.pathFor(plan.urlReference));
		});
	});
});
