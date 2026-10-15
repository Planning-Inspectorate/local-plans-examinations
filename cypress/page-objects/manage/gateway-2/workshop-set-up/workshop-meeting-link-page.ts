import { BasePage } from '../../../base-page.ts';
import { workshopSetUp } from '../../../../fixtures/manage/gateway-2.ts';

export class WorkshopRemoteLinkPage extends BasePage {
	private readonly workshopNumber: number;

	constructor(workshopNumber = 1) {
		super(new RegExp(`^/case/.+/gateway-2/set-up-workshop/workshop/gateway-2-remote-meeting-link-${workshopNumber}$`));
		this.workshopNumber = workshopNumber;
	}

	get venueRemoteLinkField() {
		return cy.get(`[name="remoteMeetingLink-${this.workshopNumber}"]`);
	}

	enterRemoteLink(link: string) {
		this.verifyLoaded();
		this.venueRemoteLinkField.clearAndWrite(link);
		this.saveAndContinue();
	}

	verifyLoaded() {
		super.verifyLoaded();
		this.verifyHeading(workshopSetUp.workshopMeetingLink.heading);
		this.venueRemoteLinkField.should('be.visible');
	}
}
export const workshopRemoteLinkPage = new WorkshopRemoteLinkPage();
