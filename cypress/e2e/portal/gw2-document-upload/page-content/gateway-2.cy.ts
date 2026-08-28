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

	it('Verifying page content for the local plan timetable upload page', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			const page = localPlanTimetablePage;
			openGateway2DocumentUploadPage(plan, page);
			localPlanTimetablePage.verifyLoaded();
			localPlanTimetablePage.verifyBackLink(gateway2ApplicationPage.pathFor(plan.urlReference));
			localPlanTimetablePage.verifyServiceNavigation('Guidance', 'Account settings', 'Manage users');
			localPlanTimetablePage.verifyMainContains('Drag and drop or choose files');
			localPlanTimetablePage.verifyNoFileChosen();
			localPlanTimetablePage.verifyUploadFormVisible();
			localPlanTimetablePage.verifyFileFormatHintText();
			localPlanTimetablePage.verifyUploadFilesButtonVisible();
			localPlanTimetablePage.verifySaveAndReturnButton();
		});
	});

	it('Verifying page content for the notice of intention to commence local plan', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			const page = noticeOfIntentionToCommenceLocalPlanPage;
			openGateway2DocumentUploadPage(plan, page);
			noticeOfIntentionToCommenceLocalPlanPage.verifyLoaded();
			noticeOfIntentionToCommenceLocalPlanPage.verifyBackLink(gateway2ApplicationPage.pathFor(plan.urlReference));
			noticeOfIntentionToCommenceLocalPlanPage.verifyServiceNavigation('Guidance', 'Account settings', 'Manage users');
			noticeOfIntentionToCommenceLocalPlanPage.verifyMainContains('Drag and drop or choose files');
			noticeOfIntentionToCommenceLocalPlanPage.verifyNoFileChosen();
			noticeOfIntentionToCommenceLocalPlanPage.verifyUploadFormVisible();
			noticeOfIntentionToCommenceLocalPlanPage.verifyFileFormatHintText();
			noticeOfIntentionToCommenceLocalPlanPage.verifyUploadFilesButtonVisible();
			noticeOfIntentionToCommenceLocalPlanPage.verifySaveAndReturnButton();
		});
	});

	it('Verifying page content for the subsequent work towards a draft plan', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			const page = subsequentWorkTowardsDraftPlanPage;
			openGateway2DocumentUploadPage(plan, page);
			subsequentWorkTowardsDraftPlanPage.verifyLoaded();
			subsequentWorkTowardsDraftPlanPage.verifyBackLink(gateway2ApplicationPage.pathFor(plan.urlReference));
			subsequentWorkTowardsDraftPlanPage.verifyServiceNavigation('Guidance', 'Account settings', 'Manage users');
			subsequentWorkTowardsDraftPlanPage.verifyMainContains('Drag and drop or choose files');
			subsequentWorkTowardsDraftPlanPage.verifyNoFileChosen();
			subsequentWorkTowardsDraftPlanPage.verifyUploadFormVisible();
			subsequentWorkTowardsDraftPlanPage.verifyFileFormatHintText();
			subsequentWorkTowardsDraftPlanPage.verifyUploadFilesButtonVisible();
			subsequentWorkTowardsDraftPlanPage.verifySaveAndReturnButton();
		});
	});
});
