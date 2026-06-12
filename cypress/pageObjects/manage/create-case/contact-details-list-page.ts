import { BasePage } from '../../base-page.ts';
import type { CreateCaseData } from './types.ts';

export class ContactDetailsListPage extends BasePage {
	constructor() {
		super('/create-a-case/contact-details/check-contact-details');
	}

	verifyLoaded() {
		this.verifyPath();
		this.verifyHeading('Contact details');
		this.addListItemButton.should('be.visible');
		this.verifySaveAndContinueVisible();
	}

	addContactDetails() {
		this.addListItem();
	}

	verifyContactListed(contact: CreateCaseData['contact']) {
		this.verifySummaryContains(contact.email);
	}
}

export const contactDetailsListPage = new ContactDetailsListPage();
