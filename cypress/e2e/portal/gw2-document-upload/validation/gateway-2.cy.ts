import { openGateway2DocumentUploadPage } from '../../../../flows/portal/gateway-2-upload-flow.ts';
import { portalLogin } from '../../../../flows/portal/login-flow.ts';
import {
	gateway2CoverLetterPage,
	localPlanTimetablePage,
	noticeOfIntentionToCommenceLocalPlanPage,
	subsequentWorkTowardsDraftPlanPage
} from '../../../../page-objects/portal/gw2-application/gateway-2-uploads.page.ts';
import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');

describe('Gateway 2 document upload validation tests', () => {
	beforeEach(() => {
		cy.task('clearDb');
		portalLogin();
	});

	after(() => cy.task('clearDb'));

	it('Shows error message when the covering letter file type is not allowed', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			const page = gateway2CoverLetterPage;
			openGateway2DocumentUploadPage(plan, page);
			page.verifyInvalidFileTypeError();
		});
	});

	it('Shows error message when no file is uploaded to the covering letter', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			const page = gateway2CoverLetterPage;
			openGateway2DocumentUploadPage(plan, page);
			page.verifyNoFileUploadedError();
		});
	});

	it('Shows error message when the local plan timetable file type is not allowed', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			const page = localPlanTimetablePage;
			openGateway2DocumentUploadPage(plan, page);
			page.verifyInvalidFileTypeError();
		});
	});

	it('Shows error message when no file is uploaded to the local plan timetable', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			const page = localPlanTimetablePage;
			openGateway2DocumentUploadPage(plan, page);
			page.verifyNoFileUploadedError();
		});
	});

	it(
		'Shows error message when the notice of intention to commence local plan file type is not allowed',
		{ tags: ['regression'] },
		() => {
			loadPlanDetails().then((plan) => {
				const page = noticeOfIntentionToCommenceLocalPlanPage;
				openGateway2DocumentUploadPage(plan, page);
				page.verifyInvalidFileTypeError();
			});
		}
	);

	it(
		'Shows error message when no file is uploaded to the notice of intention to commence local plan',
		{ tags: ['regression'] },
		() => {
			loadPlanDetails().then((plan) => {
				const page = noticeOfIntentionToCommenceLocalPlanPage;
				openGateway2DocumentUploadPage(plan, page);
				page.verifyNoFileUploadedError();
			});
		}
	);

	it(
		'Shows error message when the subsequent work towards a draft plan file type is not allowed',
		{ tags: ['regression'] },
		() => {
			loadPlanDetails().then((plan) => {
				const page = subsequentWorkTowardsDraftPlanPage;
				openGateway2DocumentUploadPage(plan, page);
				page.verifyInvalidFileTypeError();
			});
		}
	);

	it(
		'Shows error message when no file is uploaded to the subsequent work towards a draft plan',
		{ tags: ['regression'] },
		() => {
			loadPlanDetails().then((plan) => {
				const page = subsequentWorkTowardsDraftPlanPage;
				openGateway2DocumentUploadPage(plan, page);
				page.verifyNoFileUploadedError();
			});
		}
	);
});
