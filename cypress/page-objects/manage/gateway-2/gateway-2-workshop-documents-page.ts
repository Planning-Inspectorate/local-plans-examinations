import { gateway2WorkshopDocuments } from '../../../fixtures/manage/gateway-2.ts';
import { BasePage } from '../../base-page.ts';
import { DocumentUploadPage } from '../base/index.ts';

const workshopDocumentsPath = (suffix = '') =>
	new RegExp(`^/case/.+/gateway-2/workshop/${gateway2WorkshopDocuments.path}${suffix}$`);

export const gateway2WorkshopDocumentsPage = new DocumentUploadPage(
	workshopDocumentsPath(),
	gateway2WorkshopDocuments.fieldName,
	gateway2WorkshopDocuments.heading
);

class Gateway2WorkshopDocumentsCheckPage extends BasePage {
	constructor() {
		super(workshopDocumentsPath('/check'));
	}

	verifyLoaded(fileName?: string) {
		super.verifyLoaded();
		this.verifyHeading('Check workshop documents and issue notification');
		if (fileName) {
			this.verifySummaryRowContains('Document 1', fileName);
		}
	}

	issueDocuments() {
		cy.getByData('issue-document-notification').should('be.visible').click();
	}
}

export const gateway2WorkshopDocumentsCheckPage = new Gateway2WorkshopDocumentsCheckPage();
