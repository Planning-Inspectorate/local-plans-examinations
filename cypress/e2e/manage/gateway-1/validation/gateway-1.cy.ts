import { openSeededGateway1Page } from '../../../../flows/manage/gateway-1-flow.ts';
import { gateway1DateAnswers, signedSLA } from '../../../../fixtures/manage/gateway-1.ts';
import {
	gateway1Page,
	noticeOfIntentionPublishDatePage,
	gateway1SignedSLAPage
} from '../../../../page-objects/manage/gateway-1/index.ts';

describe('Gateway 1 validation', () => {
	beforeEach(() => {
		cy.task('clearDb');
		openSeededGateway1Page();
	});

	after(() => cy.task('clearDb'));

	it('shows an error when a Gateway 1 date is blank', { tags: ['regression'] }, () => {
		gateway1Page.openActionLinkFor(gateway1DateAnswers.noticeOfIntention.row);
		noticeOfIntentionPublishDatePage.verifyLoaded(gateway1DateAnswers.noticeOfIntention.input);
		noticeOfIntentionPublishDatePage.clearDate();
		noticeOfIntentionPublishDatePage.saveAndContinue();

		noticeOfIntentionPublishDatePage.verifyLoaded();
		//valid date error message assertions need 2 spaces due to how the message is processed
		noticeOfIntentionPublishDatePage.verifyValidationError('Enter  a valid date');
	});

	it('shows an error when an incorrect file type is uploaded to signed SLA', { tags: ['regression'] }, () => {
		gateway1Page.openActionLinkFor(signedSLA.row);
		gateway1SignedSLAPage.verifyLoaded();
		gateway1SignedSLAPage.dragAndDropFile('test-document-invalid.txt', signedSLA.fieldName);
		gateway1SignedSLAPage.clickUploadFiles();

		gateway1SignedSLAPage.verifyLoaded();

		gateway1SignedSLAPage.verifyErrorSummaryContains(
			'The selected file must be PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, MSG, JPG, JPEG, MPEG, MP3, MP4, MOV, PNG, TIF, TIFF'
		);
	});
});
