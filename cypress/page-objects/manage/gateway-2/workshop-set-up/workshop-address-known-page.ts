import { RadioQuestionPage } from '../../base/radio-question-page.ts';
import { workshopSetUp } from '../../../../fixtures/manage/gateway-2.ts';

const workshopSetUpPath = (path: string) => new RegExp(`^/case/.+/gateway-2/set-up-workshop/workshop/${path}$`);

export class WorkshopAddressKnownPage extends RadioQuestionPage {
	constructor(workshopNumber = 1) {
		super(
			workshopSetUpPath(`gateway-2-workshop-location-known-${workshopNumber}`),
			`workshopLocationKnown-${workshopNumber}`,
			workshopSetUp.workshopAddressKnown.heading,
			[
				{ value: 'yes', text: 'Yes' },
				{ value: 'no', text: 'No' }
			]
		);
	}
}
export const workshopAddressKnownPage = new WorkshopAddressKnownPage();
