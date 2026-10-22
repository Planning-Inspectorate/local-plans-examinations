import { GatewayBasePage } from '../base/gateway-page.ts';
import { examinationReport, soundUnsound, soundUnsoundDate } from '../../../fixtures/manage/examination.ts';

export class ExaminationPage extends GatewayBasePage {
	constructor() {
		super(/^\/case\/.+\/examination$/);
	}

	verifyReportIssued(outcome: string) {
		this.verifyLoaded();
		this.verifyNotificationBanner(examinationReport.issuedMessage);
		this.verifySummaryRowContains(examinationReport.row, '1 document added');
		this.verifySummaryRowContains(soundUnsound.row, outcome);
	}

	verifyReportDetails(documentCount: number, outcome: string, issuedDate: string) {
		this.verifyLoaded();
		const documentSummary = documentCount
			? `${documentCount} document${documentCount === 1 ? '' : 's'} added`
			: 'Not provided';
		this.verifySummaryRowContains(examinationReport.row, documentSummary);
		this.verifySummaryRowContains(soundUnsound.row, outcome);
		this.verifySummaryRowContains(soundUnsoundDate.row, issuedDate);
	}

	verifyNoReport() {
		this.verifyReportDetails(0, 'Not started', 'Not started');
		this.summaryRowActionLink(examinationReport.row).should('contain.text', 'Add');
		this.verifySummaryRowActionHref(examinationReport.row, /^\/case\/.+\/examination\/outcome\/plan-outcome$/);
	}

	verifySectionContent(heading: string, section: string, rows: Array<{ row: string; display: string; path: string }>) {
		this.verifyBackLink('/');
		this.verifySectionHeading(heading);
		this.verifyExpectedRows(rows);
		this.verifyExpectedAnswers(rows);
		this.verifyExpectedActionLinkHrefs(section, rows);
	}

	verifyExpectedRows(rows: Array<{ row: string }>) {
		rows.forEach(({ row }) => {
			this.summaryRow(row).should('be.visible');
		});
	}

	verifyExpectedAnswers(rows: Array<{ row: string; display: string }>) {
		rows.forEach(({ row, display }) => {
			this.verifySummaryRowContains(row, display);
		});
	}

	verifyExpectedActionLinkHrefs(section: string, rows: Array<{ row: string; path: string }>) {
		rows.forEach(({ row, path }) => {
			this.verifySummaryRowActionHref(row, new RegExp(`^/case/.+/examination/${section}/${path}$`));
		});
	}
}

export const examinationPage = new ExaminationPage();
