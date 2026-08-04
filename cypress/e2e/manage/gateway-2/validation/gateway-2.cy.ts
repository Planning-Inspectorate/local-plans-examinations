import { openSeededGateway2Page } from '../../../../flows/manage/gateway-2-flow.ts';
import { gateway2DateAnswers } from '../../../../fixtures/manage/gateway-2.ts';
import { gateway2Page, gateway2ActualDatePage } from '../../../../page-objects/manage/gateway-2/index.ts';

describe('Gateway 1 validation', () => {
	beforeEach(() => {
		cy.task('clearDb');
		openSeededGateway2Page();
	});

	after(() => cy.task('clearDb'));

	it('shows an error when a Gateway 1 date is blank', { tags: ['regression'] }, () => {
		gateway2Page.openActionLinkFor(gateway2DateAnswers.gateway2ActualDate.row);
		gateway2ActualDatePage.verifyLoaded(gateway2DateAnswers.gateway2ActualDate.input);
		gateway2ActualDatePage.clearDate();
		gateway2ActualDatePage.saveAndContinue();

		gateway2ActualDatePage.verifyLoaded();
		gateway2ActualDatePage.verifyValidationError('Enter  a valid date');
	});
});
