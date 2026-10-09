import { BasePage } from '../../../base-page.ts';
import { workshopSetUp } from '../../../../fixtures/manage/gateway-2.ts';

class WorkshopRemoteLinkPage extends BasePage {
	constructor() {
		super(/^\/case\/.+\/gateway-2\/set-up-workshop\/workshop\/gateway-2-remote-meeting-link-1$/);
	}

	get venueRemoteLinkField() {
		return cy.get(`[name="${workshopSetUp.workshopMeetingLink.fieldName}"`);
	}

	enterRemoteLink(link: string) {
		this.venueRemoteLinkField.clearAndWrite(link);
		this.saveAndContinue();
	}
}
export const workshopRemoteLinkPage = new WorkshopRemoteLinkPage();
