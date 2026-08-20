import { openGateway2CoverLetterUploadPage } from '../../../../flows/portal/gateway-2-upload-flow.ts';
import { portalLogin } from '../../../../flows/portal/login-flow.ts';
import { gateway2ApplicationPage } from '../../../../page-objects/portal/gw2-application/gateway-2-application-page.ts';
import { gateway2CoverLetterPage } from '../../../../page-objects/portal/gw2-application/gateway-2-uploads.page.ts';
import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');

describe('Gateway 2 document upload journeys', () => {
	beforeEach(() => {
		portalLogin();
	});

	it('Adds a covering letter using drag and drop, then replaces it with new document', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			openGateway2CoverLetterUploadPage(plan);
			gateway2CoverLetterPage.dragAndDropFile('test-document.pdf');
			gateway2CoverLetterPage.clickUploadFiles();
			gateway2CoverLetterPage.verifyFileUploaded('test-document.pdf');

			gateway2CoverLetterPage.goBack();
			gateway2ApplicationPage.verifyLoaded();

			gateway2ApplicationPage.clickAddLink('add-gateway-2-covering-letter');
			gateway2CoverLetterPage.verifyLoaded();
			gateway2CoverLetterPage.verifyFileUploaded('test-document.pdf');

			gateway2CoverLetterPage.removeFile();
			gateway2CoverLetterPage.verifyFileNotUploaded('test-document.pdf');

			gateway2CoverLetterPage.uploadFile('test-document.docx');
			gateway2CoverLetterPage.clickUploadFiles();
			gateway2CoverLetterPage.verifyFileUploaded('test-document.docx');
		});
	});

	it('Shows both uploaded covering letter files on the Gateway 2 submission page', { tags: ['regression'] }, () => {
		loadPlanDetails().then((plan) => {
			openGateway2CoverLetterUploadPage(plan);
			gateway2CoverLetterPage.uploadFile('test-document.pdf');
			gateway2CoverLetterPage.clickUploadFiles();
			gateway2CoverLetterPage.verifyFileUploaded('test-document.pdf');

			gateway2CoverLetterPage.uploadFile('test-document.docx');
			gateway2CoverLetterPage.clickUploadFiles();
			gateway2CoverLetterPage.verifyFileUploaded('test-document.docx');

			gateway2CoverLetterPage.saveAndReturn();
			gateway2ApplicationPage.verifyLoaded();

			gateway2ApplicationPage.verifyDocumentRowContains(
				gateway2ApplicationPage.proceduralDocumentsTable,
				'Gateway 2 covering letter',
				'test-document.pdf',
				'test-document.docx'
			);
		});
	});
});
