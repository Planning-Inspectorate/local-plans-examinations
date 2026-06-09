import { contactDetailsListPage, contactDetailsPage } from '../../../../pageObjects/manage/create-case/index.ts';

describe('Create a case - contact details', () => {
	it('requires at least one contact before continuing', { tags: ['regression'] }, () => {
		contactDetailsListPage.visitAndSubmitForValidation('You must add at least one contact');
	});

	it('shows validation for required contact fields', { tags: ['regression'] }, () => {
		contactDetailsPage.visitForNewItemAndSubmitForValidation(
			'Input a first name',
			'Input a last name',
			'Input an email address',
			'Select the organisation for this contact'
		);
	});
});
