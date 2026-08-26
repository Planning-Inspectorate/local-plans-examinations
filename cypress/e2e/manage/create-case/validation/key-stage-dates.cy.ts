import { keyStageDatesPage } from '../../../../page-objects/manage/create-case/key-stage-dates-page.ts';
import { invalidDateInputs } from '../../../../fixtures/manage/validation-data.ts';

describe('key stage dates validation', () => {
	beforeEach(() => {
		cy.task('clearDb');
	});

	afterEach(() => {
		cy.task('clearDb');
	});

	it('shows validation when an invalid date is entered', { tags: ['regression'] }, () => {
		keyStageDatesPage.visit();
		invalidDateInputs.forEach(({ input, errorMessage }) => {
			keyStageDatesPage.verifyDateInputValidationError('gateway1Date', input, errorMessage);
		});
	});
});
