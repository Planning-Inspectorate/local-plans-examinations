import { gatewayBasePage } from '../base/gateway-page.ts';
import { gateway1DateAnswers, gateway1DsaAnswer, gateway1ExpectedAnswers } from '../../../fixtures/manage/gateway-1.ts';

const gateway1Rows = [...Object.values(gateway1DateAnswers).map(({ row }) => row), gateway1DsaAnswer.row];

const actionLinkHrefs: Array<[string, RegExp]> = [
	...Object.values(gateway1DateAnswers).map(({ row, path }): [string, RegExp] => [
		row,
		new RegExp(`^/case/.+/gateway-1/gateway-1/${path}$`)
	]),
	[gateway1DsaAnswer.row, new RegExp(`^/case/.+/gateway-1/gateway-1/${gateway1DsaAnswer.path}$`)]
];

export class Gateway1Page extends gatewayBasePage {
	constructor() {
		super(/^\/case\/.+\/gateway-1$/);
	}

	verifyExpectedRows() {
		gateway1Rows.forEach((key) => {
			this.summaryRow(key).should('be.visible');
		});
	}

	verifyExpectedSeededAnswers() {
		gateway1ExpectedAnswers.forEach(({ row, display }) => {
			this.verifySummaryRowContains(row, display);
		});
	}

	verifyExpectedActionLinkHrefs() {
		actionLinkHrefs.forEach(([key, href]) => {
			this.verifySummaryRowActionHref(key, href);
		});
	}
}

export const gateway1Page = new Gateway1Page();
