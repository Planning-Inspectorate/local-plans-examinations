import { RadioQuestionPage } from '../../base/radio-question-page.ts';
import { workshopSetUp } from '../../../../fixtures/manage/gateway-2.ts';

const workshopSetUpPath = (path: string) => new RegExp(`^/case/.+/gateway-2/set-up-workshop/workshop/${path}$`);

export class WorkshopRemoteLinkKnownPage extends RadioQuestionPage {
	constructor(workshopNumber = 1) {
		super(
			workshopSetUpPath(`gateway-2-remote-meeting-link-known-${workshopNumber}`),
			`remoteMeetingLinkKnown-${workshopNumber}`,
			workshopSetUp.workshopMeetingLinkKnown.heading,
			[
				{ value: 'yes', text: 'Yes' },
				{ value: 'no', text: 'No' }
			]
		);
	}
}
export const workshopRemoteLinkKnownPage = new WorkshopRemoteLinkKnownPage();
