import {
	gateway1DsaPage,
	gateway1EstimatedDatePage,
	gateway1Page,
	noticeOfIntentionPublishDatePage
} from '../../../../page-objects/manage/gateway-1/index.ts';
import { openSeededGateway1Page } from '../../../../flows/manage/gateway-1-flow.ts';
import {
	gateway1DateAnswers,
	gateway1DsaAnswer,
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

		gateway1Page.verifyLoaded('Cypress Test Plan');
		gateway1Page.verifySummaryRowContains(gateway1DateAnswers.noticeOfIntention.row, updatedNoticeOfIntention.display);
	});

	it('updates the DSA answer', () => {
		gateway1Page.openActionLinkFor(gateway1DsaAnswer.row);
		gateway1DsaPage.verifyLoaded(gateway1DsaAnswer.value);
		gateway1DsaPage.selectAnswer(gateway1DsaAnswer.updatedValue);

		gateway1Page.verifyLoaded('Cypress Test Plan');
		gateway1Page.verifySummaryRowContains(gateway1DsaAnswer.row, gateway1DsaAnswer.updatedDisplay);
	});

	it('returns to Gateway 1 from Gateway 1 answer page back links', () => {
		gateway1Page.openActionLinkFor(gateway1DateAnswers.estimatedGateway1Date.row);
		gateway1EstimatedDatePage.verifyLoaded(gateway1DateAnswers.estimatedGateway1Date.input);
		gateway1EstimatedDatePage.goBack();

		gateway1Page.verifyLoaded('Cypress Test Plan');

		gateway1Page.openActionLinkFor(gateway1DsaAnswer.row);
		gateway1DsaPage.verifyLoaded(gateway1DsaAnswer.value);
		gateway1DsaPage.goBack();

		gateway1Page.verifyLoaded('Cypress Test Plan');
	});
});
