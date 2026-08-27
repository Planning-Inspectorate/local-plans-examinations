import {
	gateway1DsaPage,
	gateway1ExpectedDatePage,
	gateway1Page,
	noticeOfIntentionPublishDatePage,
	gateway1SignedSLAPage
} from '../../../../page-objects/manage/gateway-1/index.ts';
import { openSeededGateway1Page } from '../../../../flows/manage/gateway-1-flow.ts';
import { seededCase } from '../../../../fixtures/manage/case.ts';
import {
	gateway1DateAnswers,
	gateway1DsaAnswer,
	signedSLA,
	updatedNoticeOfIntention
} from '../../../../fixtures/manage/gateway-1.ts';

describe('Gateway 1 updates', () => {
	beforeEach(() => {
		cy.task('clearDb');
		openSeededGateway1Page();
	});

	after(() => cy.task('clearDb'));

	it('updates a Gateway 1 date answer', () => {
		gateway1Page.openActionLinkFor(gateway1DateAnswers.noticeOfIntention.row);
		noticeOfIntentionPublishDatePage.verifyLoaded(gateway1DateAnswers.noticeOfIntention.input);
		noticeOfIntentionPublishDatePage.enterDate(updatedNoticeOfIntention.input);

		gateway1Page.verifyLoaded(seededCase.planTitle);
		gateway1Page.verifySummaryRowContains(gateway1DateAnswers.noticeOfIntention.row, updatedNoticeOfIntention.display);
	});

	it('updates the DSA answer', () => {
		gateway1Page.openActionLinkFor(gateway1DsaAnswer.row);
		gateway1DsaPage.verifyLoaded(gateway1DsaAnswer.value);
		gateway1DsaPage.selectAnswer(gateway1DsaAnswer.updatedValue);

		gateway1Page.verifyLoaded(seededCase.planTitle);
		gateway1Page.verifySummaryRowContains(gateway1DsaAnswer.row, gateway1DsaAnswer.updatedDisplay);
	});

	it('uploads 2 signed SLA documents and removes one', () => {
		gateway1Page.openActionLinkFor(signedSLA.row);
		gateway1SignedSLAPage.verifyLoaded();

		gateway1SignedSLAPage.dragAndDropFile('test-document.pdf', signedSLA.fieldName);
		gateway1SignedSLAPage.clickUploadFiles();
		gateway1SignedSLAPage.verifyFileUploaded('test-document.pdf');

		gateway1SignedSLAPage.removeFile('test-document.pdf');
		gateway1SignedSLAPage.verifyFileNotUploaded('test-document.pdf');

		gateway1SignedSLAPage.dragAndDropFile('test-document.docx', signedSLA.fieldName);
		gateway1SignedSLAPage.clickUploadFiles();
		gateway1SignedSLAPage.verifyFileUploaded('test-document.docx');
		gateway1SignedSLAPage.goBack();

		gateway1Page.verifySummaryRowContains(signedSLA.row, 'test-document.docx');
	});

	it('returns to Gateway 1 from Gateway 1 answer page back links', () => {
		gateway1Page.openActionLinkFor(gateway1DateAnswers.expectedGateway1Date.row);
		gateway1ExpectedDatePage.verifyLoaded(gateway1DateAnswers.expectedGateway1Date.input);
		gateway1ExpectedDatePage.goBack();

		gateway1Page.verifyLoaded(seededCase.planTitle);

		gateway1Page.openActionLinkFor(gateway1DsaAnswer.row);
		gateway1DsaPage.verifyLoaded(gateway1DsaAnswer.value);
		gateway1DsaPage.goBack();

		gateway1Page.verifyLoaded(seededCase.planTitle);
	});
});
