import { gateway3DocumentsAnswer } from '../../../fixtures/manage/gateway-3.ts';
import { BasePage } from '../../base-page.ts';
import { DocumentUploadPage } from '../base/index.ts';

const gateway3ReportPath = (path: string) =>
	new RegExp(`^/case/.+/gateway-3-report/gateway-3-submission-(\\d+)/${path}-(\\d+)$`);

export const gateway3DocumentsPage = new DocumentUploadPage(
	gateway3ReportPath(gateway3DocumentsAnswer.path),
	`${gateway3DocumentsAnswer.fieldName}-1`,
	gateway3DocumentsAnswer.heading,
	gateway3DocumentsAnswer.caption
);

class Gateway3DocumentsCheckPage extends BasePage {
	constructor() {
		super(/^\/case\/.+\/gateway-3-report\/gateway-3-submission-(\d+)\/gateway-3-document-(\d+)\/check$/);
	}

	get previewDropDown() {
		return cy.getByData('preview-email-to-lpa');
	}

	get issueDecisionButton() {
		return cy.contains('button', 'Issue decision');
	}

	verifyLoaded(fileNames: string[] = []) {
		super.verifyLoaded();
		this.verifyHeading('Check gateway 3 decision and report details');
		this.issueDecisionButton.should('be.visible');
		this.previewDropDown.should('be.visible');
		this.verifyChangeLinks();
		this.verifySummaryRowContains('Outcome', 'Resubmission required');

		fileNames.forEach((fileName, index) => {
			this.verifySummaryRowContains(`Document ${index + 1}`, fileName);
		});
	}
	verifyChangeLinks() {
		this.verifySummaryRowActionHref('Document 1', gateway3ReportPath(gateway3DocumentsAnswer.path));
	}

	issueDecision() {
		this.issueDecisionButton.should('be.visible').click();
	}
}

export const gateway3DocumentsCheckPage = new Gateway3DocumentsCheckPage();
