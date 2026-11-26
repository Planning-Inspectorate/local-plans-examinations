import { BasePage } from '../../base-page.ts';

class Gateway2SubmissionDocumentsPage extends BasePage {
	constructor() {
		super(/^\/case\/.+\/gateway-2\/gateway-2\/gateway2Documents$/);
	}

	verifyLoaded() {
		super.verifyLoaded();
		this.verifyHeading('Submitted GW2 documents');
	}

	verifyWorkshopDocumentsAbsent() {
		this.mainContent.should('not.contain.text', 'Workshop document');
		this.mainContent.find('a[href*="gateway-2-workshop-documents"]').should('not.exist');
	}
}

export const gateway2SubmissionDocumentsPage = new Gateway2SubmissionDocumentsPage();
