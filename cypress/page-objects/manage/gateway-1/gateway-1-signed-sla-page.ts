import { signedSLA } from '../../../fixtures/manage/gateway-1.ts';
import { DocumentUploadPage } from '../base/index.ts';
import { BasePage } from '../../base-page.ts';

const gateway1QuestionPath = (path: string) => new RegExp(`^/case/.+/gateway-1/gateway-1/${path}$`);

export const gateway1SignedSLAPage = new DocumentUploadPage(
	gateway1QuestionPath(signedSLA.path),
	signedSLA.fieldName,
	signedSLA.heading,
	signedSLA.caption
);

class Gateway1SignedSLACheckPage extends BasePage {
	constructor() {
		super(/^\/case\/.+\/gateway-1\/gateway-1\/signed-sla\/check$/);
	}

	get issueNotificationButton() {
		return cy.contains('button', 'issue notification');
	}

	get previewDropDown() {
		return cy.getByData('preview-email-to-lpa');
	}

	verifyLoaded(fileName?: string) {
		super.verifyLoaded();
		this.verifyHeading('Check signed SLA and issue notification');
		this.issueNotificationButton.should('be.visible');
		this.previewDropDown.should('be.visible');
		this.verifyChangeLinks();

		if (fileName) {
			this.verifySummaryRowContains('Document 1', fileName);
		}
	}

	verifyChangeLinks() {
		this.verifySummaryRowActionHref('Document 1', gateway1QuestionPath(signedSLA.path));
		this.verifySummaryRowActionHref('Date uploaded', gateway1QuestionPath('sla-sent-date'));
	}

	issueNotification() {
		this.issueNotificationButton.should('be.visible').click();
	}
}
export const gateway1SignedSLACheckPage = new Gateway1SignedSLACheckPage();
