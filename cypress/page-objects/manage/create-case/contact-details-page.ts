import { ContactDetailsFormPage } from '../base/index.ts';

const defaultNewItemId = 'cypress-contact';

export class ContactDetailsPage extends ContactDetailsFormPage {
	constructor() {
		super(/^\/create-a-case\/contact-details\/check-contact-details\/(add|edit)\/[^/]+\/contact-details$/);
	}

	visitForNewItem(itemId = defaultNewItemId) {
		this.visit(`/create-a-case/contact-details/check-contact-details/add/${itemId}/contact-details`);
	}

	visitForNewItemAndSubmitForValidation(...messages: string[]) {
		this.visitForNewItem();
		this.verifyLoaded();
		this.submitAndVerifyValidationErrors(...messages);
	}
}

export const contactDetailsPage = new ContactDetailsPage();
