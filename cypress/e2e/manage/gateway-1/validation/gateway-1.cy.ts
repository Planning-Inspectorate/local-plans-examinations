import { openSeededGateway1Page } from '../../../../flows/manage/gateway-1-flow.ts';
import { gateway1DateAnswers } from '../../../../fixtures/manage/gateway-1.ts';
import { gateway1Page, noticeOfIntentionPublishDatePage } from '../../../../page-objects/manage/gateway-1/index.ts';

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
		noticeOfIntentionPublishDatePage.verifyValidationError('Enter  a valid date');
	});
});
