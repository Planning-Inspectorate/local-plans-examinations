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

	verifySummaryRowValueLinkHref(key: string, href: string | RegExp) {
		const assertion = typeof href === 'string' ? 'eq' : 'match';
		this.summaryRow(key)
			.find('.govuk-summary-list__value a')
			.should('be.visible')
			.should('have.attr', 'href')
			.and(assertion, href);
	}
}

export const examinationPage = new ExaminationPage();
