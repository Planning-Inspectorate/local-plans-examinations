import { BasePage } from '../../base-page.ts';
import { DateQuestionPage, DocumentUploadPage } from '../base/index.ts';
import { examinationReport, soundUnsound } from '../../../fixtures/manage/examination.ts';

const outcomePath = '^/case/.+/examination/outcome/';

export const examinationReportUploadPage = new DocumentUploadPage(
	new RegExp(`${outcomePath}examination-report$`),
	'examinationReport',
	'Upload final report and supporting documents',
	'Examination outcome'
);

export const reportIssuedDatePage = new DateQuestionPage(
	new RegExp(`${outcomePath}sound-unsound-date$`),
	'soundUnsoundDate',
	'When was the plan confirmed as sound or unsound?'
);

class ExaminationReportCheckPage extends BasePage {
	constructor() {
		super(new RegExp(`${outcomePath}examination-report/check$`));
	}

	get confirmButton() {
		return cy.getByData('issue-document-notification');
	}

	visitForCase(reference: string) {
		this.visit(`/case/${reference}/examination/outcome/${examinationReport.path}/check`);
		this.verifyLoaded();
	}

	verifyLoaded() {
		super.verifyLoaded();
		this.verifyHeading('Check documents and send notification');
		this.confirmButton.should('be.visible');
	}

	openChangeLinkFor(row: string) {
		this.verifyLoaded();
		this.summaryRowActionLink(row).should('be.visible').click();
	}

	verifyDocuments(...fileNames: string[]) {
		this.verifyLoaded();
		fileNames.forEach((fileName, index) => this.verifySummaryRowContains(`Document ${index + 1}`, fileName));
	}

	verifyAnswers(outcome: string, issuedDate: string, ...fileNames: string[]) {
		this.verifyDocuments(...fileNames);
		this.verifySummaryRowContains(soundUnsound.row, outcome);
		this.verifySummaryRowContains('Date', issuedDate);
	}

	confirm() {
		this.verifyLoaded();
		this.confirmButton.click();
	}
}

export const examinationReportCheckPage = new ExaminationReportCheckPage();
