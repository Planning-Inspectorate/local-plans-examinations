import { RadioQuestionPage } from '../../base/radio-question-page.ts';
import { workshopSetUp } from '../../../../fixtures/manage/gateway-2.ts';

const workshopSetUpPath = (path: string) => new RegExp(`^/case/.+/gateway-2/set-up-workshop/workshop/${path}$`);

export class WorkshopLocationPage extends RadioQuestionPage {
	constructor() {
		super(
			workshopSetUpPath(workshopSetUp.workshopRemoteOrInPerson.path),
			workshopSetUp.workshopRemoteOrInPerson.fieldNameRadio,
			workshopSetUp.workshopRemoteOrInPerson.heading,
			[
				{ value: 'in-person', text: 'In-person' },
				{ value: 'hybrid', text: 'Hybrid' },
				{ value: 'remote', text: 'Remote' }
			]
		);
	}
}
export const workshopLocationPage = new WorkshopLocationPage();
