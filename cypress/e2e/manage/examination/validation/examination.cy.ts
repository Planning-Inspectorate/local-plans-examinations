import { openSeededExaminationPage } from '../../../../flows/manage/examination-flow.ts';
import { factCheckDateReceivedFromInspector } from '../../../../fixtures/manage/examination.ts';
import {
	examinationPage,
	factCheckDateReceivedFromInspectorPage
} from '../../../../page-objects/manage/examination/index.ts';

describe('Examination validation', () => {
	beforeEach(() => {
		cy.task('clearDb');
		openSeededExaminationPage();
	});

	after(() => cy.task('clearDb'));

	it('shows an error when a Fact Check date is blank', { tags: ['regression'] }, () => {
		examinationPage.openActionLinkFor(factCheckDateReceivedFromInspector.row);
		factCheckDateReceivedFromInspectorPage.verifyLoaded(factCheckDateReceivedFromInspector.input);
		factCheckDateReceivedFromInspectorPage.clearDate();
		factCheckDateReceivedFromInspectorPage.saveAndContinue();

		factCheckDateReceivedFromInspectorPage.verifyLoaded();
		//valid date error message assertions need 2 spaces due to how the message is processed
		factCheckDateReceivedFromInspectorPage.verifyValidationError('Enter  a valid date');
	});
});
