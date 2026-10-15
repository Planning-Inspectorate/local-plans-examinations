import { RadioQuestionPage } from '../../base/radio-question-page.ts';
import { workshopSetUp } from '../../../../fixtures/manage/gateway-2.ts';

const workshopSetUpPath = (path: string) => new RegExp(`^/case/.+/gateway-2/set-up-workshop/workshop/${path}$`);

export class WorkshopExpectedDaysPage extends RadioQuestionPage {
	constructor(workshopNumber = 1) {
		super(
			workshopSetUpPath(`gateway-2-workshop-expected-days-${workshopNumber}`),
			`workshopExpectedDaysKnown-${workshopNumber}`,
			workshopSetUp.expectedNumberOfDays.heading,
			[
				{ value: 'yes', text: 'Yes' },
				{ value: 'no', text: 'No' }
			]
		);
	}
	get numberOfDaysField() {
		return cy.get(`[id="${this.fieldName}_workshopExpectedDays"]`);
	}
	enterNumberOfDays(numberOfDays: string) {
		this.numberOfDaysField.clearAndWrite(numberOfDays);
	}
	enterRadioAndNumberOfDays(value: string, numberOfDays: string) {
		this.verifyLoaded();
		this.answerOption(value).check({ force: true });
		this.enterNumberOfDays(numberOfDays);
		this.saveAndContinue();
	}
}
export const workshopExpectedDaysPage = new WorkshopExpectedDaysPage();
