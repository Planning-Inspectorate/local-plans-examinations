import { GatewayBasePage } from '../base/gateway-page.ts';
import {
	gateway2DateAnswers,
	workshopVenueAnswer,
	gateway2AssessorAnswer,
	gateway2ExpectedAnswers
} from '../../../fixtures/manage/gateway-2.ts';

const gateway2Rows = [
	...Object.values(gateway2DateAnswers).map(({ row }) => row),
	workshopVenueAnswer.row,
	gateway2AssessorAnswer.row
];

const actionLinkHrefs: Array<[string, RegExp]> = [
	...Object.values(gateway2DateAnswers).map(({ row, path }): [string, RegExp] => [
		row,
		new RegExp(`^/case/.+/gateway-2/gateway-2/${path}$`)
	]),
	[workshopVenueAnswer.row, new RegExp(`^/case/.+/gateway-2/gateway-2/${workshopVenueAnswer.path}$`)],
	[gateway2AssessorAnswer.row, new RegExp(`^/case/.+/gateway-2/gateway-2/${gateway2AssessorAnswer.path}$`)]
];

export class Gateway2Page extends GatewayBasePage {
	constructor() {
		super(/^\/case\/.+\/gateway-2$/);
	}

	verifyExpectedRows() {
		gateway2Rows.forEach((key) => {
			this.summaryRow(key).should('be.visible');
		});
	}

	verifyExpectedSeededAnswers() {
		gateway2ExpectedAnswers.forEach(({ row, display }) => {
			this.verifySummaryRowContains(row, display);
		});
	}

	verifyExpectedActionLinkHrefs() {
		actionLinkHrefs.forEach(([key, href]) => {
			this.verifySummaryRowActionHref(key, href);
		});
	}
}

export const gateway2Page = new Gateway2Page();
