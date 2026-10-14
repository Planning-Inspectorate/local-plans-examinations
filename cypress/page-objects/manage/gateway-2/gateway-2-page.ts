import { GatewayBasePage } from '../base/gateway-page.ts';
import {
	gateway2DateAnswers,
	gateway2AssessorAnswer,
	gateway2ExpectedAnswers,
	gateway2Report,
	workshopSetupExpectedAnswers,
	workshopSetUp
} from '../../../fixtures/manage/gateway-2.ts';

const gateway2Rows = [
	...Object.values(gateway2DateAnswers).map(({ row }) => row),
	gateway2AssessorAnswer.row,
	gateway2Report.row
];

const actionLinkHrefs: Array<[string, RegExp]> = [
	...Object.values(gateway2DateAnswers).map(({ row, section, path }): [string, RegExp] => [
		row,
		new RegExp(`^/case/.+/gateway-2/${section}/${path}$`)
	]),
	[gateway2AssessorAnswer.row, new RegExp(`^/case/.+/gateway-2/gateway-2/${gateway2AssessorAnswer.path}$`)],
	[gateway2Report.row, new RegExp(`^/case/.+/gateway-2/report/${gateway2Report.path}$`)]
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

	verifyWorkshopSetUp(
		workshopNumber: string,
		expectedNumberOfDays = workshopSetUp.expectedNumberOfDays.displayNumberOfDays
	) {
		this.verifySubHeading(`Workshop ${workshopNumber} details`);
		const overviewDisplayValues: Record<string, string> = {
			[workshopSetUp.expectedNumberOfDays.rowNumberOfDays]: expectedNumberOfDays,
			[workshopSetUp.workshopMeetingLinkKnown.row]: workshopSetUp.workshopMeetingLinkKnown.inputRadio,
			[workshopSetUp.workshopMeetingLink.row]: workshopSetUp.workshopMeetingLink.input
		};
		workshopSetupExpectedAnswers
			.filter(
				({ row }) => row !== workshopSetUp.expectedNumberOfDays.row && row !== workshopSetUp.workshopAddressKnown.row
			)
			.forEach(({ row, display }) => {
				this.verifySummaryRowContains(row, overviewDisplayValues[row] ?? display);
			});
		this.verifySummaryRowContains(
			workshopSetUp.workshopVenueAddress.row,
			workshopSetUp.workshopVenueAddress.values.venueName,
			workshopSetUp.workshopVenueAddress.values.addressLine1,
			workshopSetUp.workshopVenueAddress.values.townOrCity,
			workshopSetUp.workshopVenueAddress.values.postcode
		);
	}
}

export const gateway2Page = new Gateway2Page();
