import { openSeededGateway3Page } from '../../../../flows/manage/gateway-3-flow.ts';
import {
	gateway3DateAnswers,
	gateway3AssessorAnswer,
	gateway3ProgrammeOfficerAnswer
} from '../../../../fixtures/manage/gateway-3.ts';
import {
	gateway3Page,
	gateway3ActualDatePage,
	gateway3AssessorPage,
	gateway3ProgrammeOfficerPage
} from '../../../../page-objects/manage/gateway-3/index.ts';

describe('Gateway 3 validation', () => {
	beforeEach(() => {
		cy.task('clearDb');
		openSeededGateway3Page();
	});

	after(() => cy.task('clearDb'));

	it('shows an error when a Gateway 3 date is blank', { tags: ['regression'] }, () => {
		gateway3Page.openActionLinkFor(gateway3DateAnswers.gateway3ActualDate.row);
		gateway3ActualDatePage.verifyLoaded(gateway3DateAnswers.gateway3ActualDate.input);
		gateway3ActualDatePage.clearDate();
		gateway3ActualDatePage.saveAndContinue();

		gateway3ActualDatePage.verifyLoaded();
		//for valid date error messages, assertions need 2 spaces due to how the message is processed
		gateway3ActualDatePage.verifyValidationError('Enter  a valid date');
	});

	it('shows an error when Gateway 3 assessor name is blank', { tags: ['regression'] }, () => {
		gateway3Page.openActionLinkFor(gateway3AssessorAnswer.row);
		gateway3AssessorPage.verifyLoaded();
		gateway3AssessorPage.assessorNamePopulated(gateway3AssessorAnswer.assessor1);
		gateway3AssessorPage.clearAssessorNameField();
		gateway3AssessorPage.saveAndContinue();

		gateway3AssessorPage.verifyLoaded();
		gateway3AssessorPage.verifyValidationError('Select a name');
	});

	it('shows errors when the programme officer details are blank', { tags: ['regression'] }, () => {
		gateway3Page.openActionLinkFor(gateway3ProgrammeOfficerAnswer.row);
		gateway3ProgrammeOfficerPage.verifyLoaded(
			gateway3ProgrammeOfficerAnswer.firstName,
			gateway3ProgrammeOfficerAnswer.lastName,
			gateway3ProgrammeOfficerAnswer.email
		);
		gateway3ProgrammeOfficerPage.programmeOfficerFirstNameInput.clear();
		gateway3ProgrammeOfficerPage.programmeOfficerLastNameInput.clear();
		gateway3ProgrammeOfficerPage.programmeOfficerEmailInput.clear();
		gateway3ProgrammeOfficerPage.saveAndContinue();

		gateway3ProgrammeOfficerPage.verifyLoaded();
		gateway3ProgrammeOfficerPage.verifyValidationErrors(
			'Input a first name',
			'Input a last name',
			'Input an email address'
		);
	});
});
