import { BasePage } from '../../base-page.ts';
import type { CreateCaseData, SelectAnswer } from './types.ts';
import { contactDetailsPage } from './contact-details-page.ts';
import { localPlanningAuthoritiesPage } from './local-planning-authorities-page.ts';

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

	visitWithLocalPlanningAuthority(lpa: SelectAnswer) {
		localPlanningAuthoritiesPage.visit();
		localPlanningAuthoritiesPage.verifyLoaded();
		localPlanningAuthoritiesPage.addLocalPlanningAuthority(lpa);
		localPlanningAuthoritiesPage.saveAndContinue();
		this.verifyLoaded();
	}

	addContact(contact: CreateCaseData['contact']) {
		this.addContactDetails();
		contactDetailsPage.verifyLoaded();
		contactDetailsPage.enterContactDetails(contact);
		this.verifyLoaded();
	}

	changeContact(contact: CreateCaseData['contact'], index = 1) {
		this.changeListItem(index);
		contactDetailsPage.verifyLoaded();
		contactDetailsPage.enterContactDetails(contact);
		this.verifyLoaded();
	}

	removeContact(index = 1) {
		this.removeListItem(index);
		this.verifyHeading('Remove contact');
		this.saveAndContinue();
		this.verifyLoaded();
	}

	verifyContactListed(contact: CreateCaseData['contact']) {
		this.verifySummaryContains(contact.email);
	}

	verifyContactNotListed(contact: CreateCaseData['contact']) {
		this.verifySummaryDoesNotContain(contact.email);
	}
}

export const contactDetailsListPage = new ContactDetailsListPage();
