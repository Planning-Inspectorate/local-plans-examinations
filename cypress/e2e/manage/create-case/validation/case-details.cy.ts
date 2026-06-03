import { caseOfficerPage, planTitlePage, planTypePage } from '../../../../pageObjects/manage/create-case/index.ts';

describe('Create a case - case details', () => {
	it('shows validation when no case officer is selected', { tags: ['regression'] }, () => {
		caseOfficerPage.visitAndSubmitForValidation('Select a case officer');
	});

	it('shows validation when the plan title is not entered', { tags: ['regression'] }, () => {
		planTitlePage.visitAndSubmitForValidation('Input a plan title');
	});

	it('shows validation when no plan type is selected', { tags: ['regression'] }, () => {
		planTypePage.visitAndSubmitForValidation('Select a plan type');
	});
});
