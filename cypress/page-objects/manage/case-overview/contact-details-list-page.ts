import { ContactDetailsListBasePage } from '../base/index.ts';
import { caseOverviewContactDetailsPage } from './contact-details-page.ts';

export class CaseOverviewContactDetailsListPage extends ContactDetailsListBasePage {
	constructor() {
		super(caseOverviewContactDetailsPage, /^\/case\/.+\/overview\/contacts\/check-contact-details$/);
	}

	protected verifyAfterContactSave() {
		this.verifyPath(/^\/case\/.+\/overview$/);
	}
}

export const caseOverviewContactDetailsListPage = new CaseOverviewContactDetailsListPage();
