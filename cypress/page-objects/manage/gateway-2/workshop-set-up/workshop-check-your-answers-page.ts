import { BasePage } from '../../../base-page.ts';
import { workshopSetUp, workshopSetupExpectedAnswers } from '../../../../fixtures/manage/gateway-2.ts';

const workshopSetupRows = [
	...Object.values(workshopSetUp).map(({ row }) => row),
	workshopSetUp.workshopDateAndTime.rowTime,
	workshopSetUp.expectedNumberOfDays.rowNumberOfDays
];

export class WorkshopCYAPage extends BasePage {
	private readonly workshopNumber: number;

	constructor(workshopNumber = 1) {
		super(new RegExp(`^/case/.+/gateway-2/set-up-workshop/check-your-answers-${workshopNumber}$`));
		this.workshopNumber = workshopNumber;
	}

	get submitButton() {
		return cy.getByData('submit-case');
	}

	verifyLoaded() {
		super.verifyLoaded();
		this.verifyHeading('Check workshop details and issue notification');
	}

	submitWorkshop() {
		this.submitButton.should('be.visible').click();
	}

	openChangeLinkFor(key: string) {
		this.summaryRowActionLink(key).should('be.visible').click();
	}

	verifyRemoteWorkshopDetails(meetingLink: string) {
		this.verifySummaryRowContains(workshopSetUp.workshopRemoteOrInPerson.row, 'remote');
		this.mainContent
			.should('not.contain.text', workshopSetUp.workshopAddressKnown.row)
			.and('not.contain.text', workshopSetUp.workshopVenueAddress.row);
		this.verifySummaryRowContains(workshopSetUp.workshopMeetingLink.row, meetingLink);
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
		Object.values(workshopSetUp).forEach(({ row, section, path }) => {
			const questionPath = path.replace(/-1$/, `-${this.workshopNumber}`);
			this.verifySummaryRowActionHref(row, new RegExp(`^/case/.+/gateway-2/${section}/${questionPath}$`));
		});
	}
}
export const workshopCYAPage = new WorkshopCYAPage();
