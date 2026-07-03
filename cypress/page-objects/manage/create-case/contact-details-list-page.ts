import { ContactDetailsListBasePage } from '../base/index.ts';
import type { SelectAnswer } from './types.ts';
import { contactDetailsPage } from './contact-details-page.ts';
import { localPlanningAuthoritiesPage } from './local-planning-authorities-page.ts';

export class ContactDetailsListPage extends ContactDetailsListBasePage {
	constructor() {
		super(contactDetailsPage, '/create-a-case/contact-details/check-contact-details');
	}

	visitWithLocalPlanningAuthority(lpa: SelectAnswer) {
		localPlanningAuthoritiesPage.visit();
		localPlanningAuthoritiesPage.verifyLoaded();
		localPlanningAuthoritiesPage.addLocalPlanningAuthority(lpa);
		localPlanningAuthoritiesPage.saveAndContinue();
		this.verifyLoaded();
	}
}

export const contactDetailsListPage = new ContactDetailsListPage();
