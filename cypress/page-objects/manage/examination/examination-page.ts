import { GatewayBasePage } from '../base/gateway-page.ts';

export class ExaminationPage extends GatewayBasePage {
	constructor() {
		super(/^\/case\/.+\/examination$/);
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
