import { examinationLetterDates } from '../../../fixtures/manage/examination.ts';
import { GatewayBasePage } from '../base/gateway-page.ts';

const actionLinkHrefs: Array<[string, RegExp]> = examinationLetterDates.map(({ row, path }): [string, RegExp] => [
	row,
	new RegExp(`^/case/.+/examination/letters/${path}$`)
]);

export class ExaminationPage extends GatewayBasePage {
	constructor() {
		super(/^\/case\/.+\/examination$/);
	}

	verifyExpectedLetterRows() {
		examinationLetterDates.forEach(({ row }) => {
			this.summaryRow(row).should('be.visible');
		});
	}

	verifyExpectedLetterAnswers() {
		examinationLetterDates.forEach(({ row, display }) => {
			this.verifySummaryRowContains(row, display);
		});
	}

	verifyExpectedLetterActionLinkHrefs() {
		actionLinkHrefs.forEach(([key, href]) => {
			this.verifySummaryRowActionHref(key, href);
		});
	}
}

export const examinationPage = new ExaminationPage();
