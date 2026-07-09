import { BasePage } from '../../base-page.ts';

export type ContactDetails = {
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	lpaContact?: {
		value: string;
	};
};

export class ContactDetailsFormPage extends BasePage {
	get firstNameInput() {
		return cy.getByData('contact-first-name');
	}

	get lastNameInput() {
		return cy.getByData('contact-last-name');
	}

	get emailInput() {
		return cy.getByData('contact-email');
	}

	get phoneInput() {
		return cy.getByData('contact-phone');
	}

	lpaContactOption(value: string) {
		return cy.get(`#${value}`);
	}

	selectLpaContact(value: string) {
		this.lpaContactOption(value).then(($option) => {
			if ($option.is('input[type="radio"], input[type="checkbox"]')) {
				cy.wrap($option).check({ force: true });
			}
		});
	}

	verifyContactDetailsForm() {
		this.verifyHeading('What are the main contact details for the Local Planning Authority?');
		this.firstNameInput.should('be.visible');
		this.lastNameInput.should('be.visible');
		this.emailInput.should('be.visible');
		this.phoneInput.should('be.visible');
		this.verifySaveAndContinueVisible();
	}

	verifyLoaded() {
		this.verifyPath();
		this.verifyContactDetailsForm();
	}

	enterContactDetails(contact: ContactDetails) {
		this.firstNameInput.clearAndWrite(contact.firstName);
		this.lastNameInput.clearAndWrite(contact.lastName);
		this.emailInput.clearAndWrite(contact.email);
		this.phoneInput.clearAndWrite(contact.phone);

		if (contact.lpaContact) {
			this.selectLpaContact(contact.lpaContact.value);
		}

		this.saveAndContinue();
	}
}
