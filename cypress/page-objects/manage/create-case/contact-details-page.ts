import { BasePage } from '../../base-page.ts';
import type { CreateCaseData } from './types.ts';

const pathPattern = /^\/create-a-case\/contact-details\/check-contact-details\/(add|edit)\/[^/]+\/contact-details$/;
const defaultNewItemId = 'cypress-contact';

export class ContactDetailsPage extends BasePage {
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

	visitForNewItem(itemId = defaultNewItemId) {
		this.visit(`/create-a-case/contact-details/check-contact-details/add/${itemId}/contact-details`);
	}

	visitForNewItemAndSubmitForValidation(...messages: string[]) {
		this.visitForNewItem();
		this.verifyLoaded();
		this.submitAndVerifyValidationErrors(...messages);
	}

	verifyLoaded() {
		this.verifyPathMatches(pathPattern);
		this.verifyHeading('What are the main contact details for the Local Planning Authority?');
		this.firstNameInput.should('be.visible');
		this.lastNameInput.should('be.visible');
		this.emailInput.should('be.visible');
		this.phoneInput.should('be.visible');
		this.verifySaveAndContinueVisible();
	}

	enterContactDetails(contact: CreateCaseData['contact']) {
		this.firstNameInput.clearAndWrite(contact.firstName);
		this.lastNameInput.clearAndWrite(contact.lastName);
		this.emailInput.clearAndWrite(contact.email);
		this.phoneInput.clearAndWrite(contact.phone);
		this.selectLpaContact(contact.lpaContact.value);
		this.saveAndContinue();
	}
}

export const contactDetailsPage = new ContactDetailsPage();
