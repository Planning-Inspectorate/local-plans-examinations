import { RadioQuestionPage } from '../../base/radio-question-page.ts';
import { workshopSetUp } from '../../../../fixtures/manage/gateway-2.ts';

const workshopSetUpPath = (path: string) => new RegExp(`^/case/.+/gateway-2/set-up-workshop/workshop/${path}$`);

export class WorkshopExpectedDaysPage extends RadioQuestionPage {
	constructor() {
		super(
			workshopSetUpPath(workshopSetUp.expectedNumberOfDays.path),
			workshopSetUp.expectedNumberOfDays.fieldNameRadio,
			workshopSetUp.expectedNumberOfDays.heading,
			[
				{ value: 'yes', text: 'Yes' },
				{ value: 'no', text: 'No' }
			]
		);
	}
	get numberOfDaysField() {
		return cy.get(`[id="${workshopSetUp.expectedNumberOfDays.fieldNameDays}"]`);
	}
	enterNumberOfDays(numberOfDays: string) {
		this.numberOfDaysField.clearAndWrite(numberOfDays);
	}
	enterRadioAndNumberOfDays(value: string, numberOfDays: string) {
		this.answerOption(value).check({ force: true });
		this.enterNumberOfDays(numberOfDays);
		this.saveAndContinue();
	}
}
export const workshopExpectedDaysPage = new WorkshopExpectedDaysPage();
