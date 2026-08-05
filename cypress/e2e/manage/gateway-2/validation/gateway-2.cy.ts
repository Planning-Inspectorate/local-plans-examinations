import { openSeededGateway2Page } from '../../../../flows/manage/gateway-2-flow.ts';
import {
	gateway2DateAnswers,
	workshopVenueAnswer,
	gateway2AssessorAnswer
} from '../../../../fixtures/manage/gateway-2.ts';
import {
	gateway2Page,
	gateway2ActualDatePage,
	workshopVenuePage,
	gateway2AssessorPage
} from '../../../../page-objects/manage/gateway-2/index.ts';

describe('Gateway 2 validation', () => {
	beforeEach(() => {
		cy.task('clearDb');
		openSeededGateway2Page();
	});

	after(() => cy.task('clearDb'));

	it('shows an error when a Gateway 2 date is blank', { tags: ['regression'] }, () => {
		gateway2Page.openActionLinkFor(gateway2DateAnswers.gateway2ActualDate.row);
		gateway2ActualDatePage.verifyLoaded(gateway2DateAnswers.gateway2ActualDate.input);
		gateway2ActualDatePage.clearDate();
		gateway2ActualDatePage.saveAndContinue();

		gateway2ActualDatePage.verifyLoaded();
		//for valid date error messages, asssertions need 2 spaces due to how the message is processed
		gateway2ActualDatePage.verifyValidationError('Enter  a valid date');
	});

	it('shows an error when a workshop venue is blank', { tags: ['regression'] }, () => {
		gateway2Page.openActionLinkFor(workshopVenueAnswer.row);
		workshopVenuePage.verifyLoaded(workshopVenueAnswer.value);
		workshopVenuePage.workshopVenueInput.clear();
		workshopVenuePage.saveAndContinue();

		workshopVenuePage.verifyLoaded();
		workshopVenuePage.verifyValidationError('Enter a venue name');
	});

	it('shows an error when Gateway 2 assessor name is blank', { tags: ['regression'] }, () => {
		gateway2Page.openActionLinkFor(gateway2AssessorAnswer.row);
		gateway2AssessorPage.verifyLoaded(gateway2AssessorAnswer.assessor1);
		gateway2AssessorPage.assessorNameField.clear();
		gateway2AssessorPage.saveAndContinue();

		gateway2AssessorPage.verifyLoaded();
		gateway2AssessorPage.verifyValidationError('Select a name');
	});
});
