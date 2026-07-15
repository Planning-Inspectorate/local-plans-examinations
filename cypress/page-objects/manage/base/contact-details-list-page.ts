import { BasePage } from '../../base-page.ts';
import type { ContactDetails, ContactDetailsFormPage } from './contact-details-form-page.ts';

export class ContactDetailsListBasePage extends BasePage {
	private readonly contactDetailsPage: ContactDetailsFormPage;

	constructor(contactDetailsPage: ContactDetailsFormPage, path?: string | RegExp) {
		super(path);
		this.contactDetailsPage = contactDetailsPage;
	}

	protected verifyAfterContactSave() {
		this.verifyLoaded();
	}

	verifyContactDetailsList() {
		this.verifyHeading('Contact details');
		this.addListItemButton.should('be.visible');
		this.verifySaveAndContinueVisible();
	}

	verifyLoaded() {
		super.verifyLoaded();
		this.verifyContactDetailsList();
	}

	addContactDetails() {
		this.addListItem();
	}

	addContact(contact: ContactDetails) {
		this.addContactDetails();
		this.contactDetailsPage.verifyLoaded();
		this.contactDetailsPage.enterContactDetails(contact);
		this.verifyAfterContactSave();
	}

	changeContact(contact: ContactDetails, index = 1) {
		this.changeListItem(index);
		this.contactDetailsPage.verifyLoaded();
		this.contactDetailsPage.enterContactDetails(contact);
		this.verifyAfterContactSave();
	}

	removeContact(index = 1) {
		this.removeListItem(index);
		this.verifyHeading('Remove contact');
		this.saveAndContinue();
		this.verifyLoaded();
	}

	verifyContactListed(contact: ContactDetails) {
		this.verifySummaryContains(contact.firstName, contact.lastName, contact.email, contact.phone);
	}

	verifyContactNotListed(contact: ContactDetails) {
		this.verifySummaryDoesNotContain(contact.email);
	}
}
