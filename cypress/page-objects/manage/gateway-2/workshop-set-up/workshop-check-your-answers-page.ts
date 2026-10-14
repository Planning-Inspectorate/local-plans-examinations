import { BasePage } from '../../../base-page.ts';
import { workshopSetUp, workshopSetupExpectedAnswers } from '../../../../fixtures/manage/gateway-2.ts';

const workshopSetupRows = [
	...Object.values(workshopSetUp).map(({ row }) => row),
	workshopSetUp.workshopDateAndTime.rowTime,
	workshopSetUp.expectedNumberOfDays.rowNumberOfDays
];

const actionLinkHrefs: Array<[string, RegExp]> = [
	...Object.values(workshopSetUp).map(({ row, section, path }): [string, RegExp] => [
		row,
		new RegExp(`^/case/.+/gateway-2/${section}/${path}$`)
	])
];

class WorkshopCYAPage extends BasePage {
	constructor() {
		super(/^\/case\/.+\/gateway-2\/set-up-workshop\/check-your-answers-1$/);
	}

	get submitButton() {
		return cy.getByData('submit-case');
	}

	submitWorkshop() {
		this.submitButton.click();
	}

	openChangeLinkFor(key: string) {
		this.summaryRowActionLink(key).should('be.visible').click();
	}

	verifyExpectedRows() {
		workshopSetupRows.forEach((key) => {
			this.summaryRow(key).should('be.visible');
		});
	}

	verifyExpectedSeededAnswers() {
		workshopSetupExpectedAnswers.forEach(({ row, display }) => {
			this.verifySummaryRowContains(row, display);
		});
		this.verifySummaryRowContains(
			workshopSetUp.workshopVenueAddress.row,
			workshopSetUp.workshopVenueAddress.values.venueName,
			workshopSetUp.workshopVenueAddress.values.addressLine1,
			workshopSetUp.workshopVenueAddress.values.townOrCity,
			workshopSetUp.workshopVenueAddress.values.postcode
		);
	}

	verifyExpectedActionLinkHrefs() {
		actionLinkHrefs.forEach(([key, href]) => {
			this.verifySummaryRowActionHref(key, href);
		});
	}
}
export const workshopCYAPage = new WorkshopCYAPage();
