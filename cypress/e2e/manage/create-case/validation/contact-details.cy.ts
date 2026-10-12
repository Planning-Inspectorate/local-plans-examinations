import {
	contactDetailsListPage,
	contactDetailsPage,
	type CreateCaseData
} from '../../../../page-objects/manage/create-case/index.ts';

const loadCreateCaseData = () => cy.fixture<CreateCaseData>('manage/create-case.json');

describe('Create a case - contact details', () => {
	it('requires at least one contact before continuing', { tags: ['regression'] }, () => {
		contactDetailsListPage.visitAndSubmitForValidation('You need to add a contact');
	});

	it('shows validation for required contact fields', { tags: ['regression'] }, () => {
		contactDetailsPage.visitForNewItemAndSubmitForValidation(
			'Enter a first name',
			'Enter a last name',
			'Enter an email address',
			'Select a planning authority'
		);
	});

	it('changes and removes contacts', { tags: ['regression'] }, () => {
		loadCreateCaseData().then((data) => {
			const [firstLpa] = Object.values(data.lpa);
			const secondContact: CreateCaseData['contact'] = {
				...data.contact,
				firstName: 'Second',
				lastName: 'Contact',
				email: 'second.contact@example.com',
				phone: '02079460001'
			};
			const updatedContact: CreateCaseData['contact'] = {
				...data.contact,
				firstName: 'Updated',
				lastName: 'Contact',
				email: 'updated.contact@example.com',
				phone: '02079460002'
			};

			contactDetailsListPage.visitWithLocalPlanningAuthority(firstLpa);
			contactDetailsListPage.addContact(data.contact);
			contactDetailsListPage.addContact(secondContact);
			contactDetailsListPage.changeContact(updatedContact, 2);
			contactDetailsListPage.verifyContactListed(updatedContact);
			contactDetailsListPage.verifyContactNotListed(secondContact);

			contactDetailsListPage.removeContact(2);
			contactDetailsListPage.verifyContactListed(data.contact);
			contactDetailsListPage.verifyContactNotListed(updatedContact);
			contactDetailsListPage.verifyRemoveListItemHidden();
		});
	});
});
