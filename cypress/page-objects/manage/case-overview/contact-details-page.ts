import { ContactDetailsFormPage } from '../base/index.ts';

export class CaseOverviewContactDetailsPage extends ContactDetailsFormPage {
	constructor() {
		super(/^\/case\/.+\/overview\/contacts\/check-contact-details\/edit\/[^/]+\/contact-details$/);
	}
}

export const caseOverviewContactDetailsPage = new CaseOverviewContactDetailsPage();
