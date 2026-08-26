import { gateway2Report } from '../../../fixtures/manage/gateway-2.ts';
import { BasePage } from '../../base-page.ts';
import { DocumentUploadPage } from '../base/index.ts';

const gateway2ReportPath = (path: string) => new RegExp(`^/case/.+/gateway-2/report/${path}$`);

export const gateway2ReportPage = new DocumentUploadPage(
	gateway2ReportPath(gateway2Report.path),
	gateway2Report.fieldName,
	gateway2Report.heading,
	gateway2Report.caption
);

class Gateway2ReportCheckPage extends BasePage {
	constructor() {
		super(/^\/case\/.+\/gateway-2\/report\/gateway-2-report\/check$/);
	}

	get issueReportButton() {
		return cy.contains('button', 'Issue report');
	}

	verifyLoaded(fileName?: string) {
		super.verifyLoaded();
		this.verifyHeading('Check Gateway 2 report details and issue notification');
		this.issueReportButton.should('be.visible');

		if (fileName) {
			this.verifySummaryRowContains('Document 1', fileName);
		}
	}

	issueReport() {
		this.issueReportButton.should('be.visible').click();
	}
}

export const gateway2ReportCheckPage = new Gateway2ReportCheckPage();
