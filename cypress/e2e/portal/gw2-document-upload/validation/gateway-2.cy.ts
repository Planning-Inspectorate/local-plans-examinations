import { openGateway2CoverLetterUploadPage } from '../../../../flows/portal/gateway-2-upload-flow.ts';
import { portalLogin } from '../../../../flows/portal/login-flow.ts';
import { gateway2CoverLetterPage } from '../../../../page-objects/portal/gw2-application/gateway-2-uploads.page.ts';
import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';
import { ERROR_MESSAGES } from 'cypress/constants/portal/error-messages.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');

describe('Gateway 2 document upload validation tests', () => {
	beforeEach(() => {
		portalLogin();
	});

	it.skip('Shows error message when the covering letter file is over 250MB', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			openGateway2CoverLetterUploadPage(plan);
			gateway2CoverLetterPage.uploadFile('test-document-over-250MB.xlsx');
			gateway2CoverLetterPage.clickUploadFiles();
			gateway2CoverLetterPage.verifyErrorSummary(ERROR_MESSAGES.THERE_IS_A_PROBLEM, ERROR_MESSAGES.FILE_TOO_LARGE);
		});
	});

	it('Shows error message when the covering letter file type is not allowed', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			openGateway2CoverLetterUploadPage(plan);
			gateway2CoverLetterPage.uploadFile('test-document-invalid.txt');
			gateway2CoverLetterPage.clickUploadFiles();
			gateway2CoverLetterPage.verifyErrorSummary(ERROR_MESSAGES.THERE_IS_A_PROBLEM, ERROR_MESSAGES.INVALID_FILE_FORMAT);
		});
	});

	it('Shows error message when no file is uploaded to the covering letter', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			openGateway2CoverLetterUploadPage(plan);
			gateway2CoverLetterPage.clickUploadFiles();
			gateway2CoverLetterPage.verifyErrorSummary(ERROR_MESSAGES.THERE_IS_A_PROBLEM, ERROR_MESSAGES.NO_FILE_UPLOADED);
		});
	});
});
