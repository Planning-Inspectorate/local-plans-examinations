import type { DateAnswer } from '../../../../types/date.ts';
import { workshopSetUp } from '../../../../fixtures/manage/gateway-2.ts';
import { DateQuestionPage } from '../../base/date-question-page.ts';

export type TimeAnswer = {
	hour: string;
	minute: string;
};
const workshopSetUpPath = (path: string) => new RegExp(`^/case/.+/gateway-2/set-up-workshop/workshop/${path}$`);
export class WorkshopDateAndTimePage extends DateQuestionPage {
	private readonly timeFieldName: string;

	constructor(workshopNumber = 1) {
		super(
			workshopSetUpPath(`gateway-2-workshop-date-and-time-${workshopNumber}`),
			`workshopDate-${workshopNumber}`,
			workshopSetUp.workshopDateAndTime.heading
		);
		this.timeFieldName = `workshopTime-${workshopNumber}`;
	}
	get hourField() {
		return cy.get(`[name="${this.timeFieldName}_hour"]`);
	}

	get minuteField() {
		return cy.get(`[name="${this.timeFieldName}_minute"]`);
	}

	verifyLoaded() {
		super.verifyLoaded();
		this.verifyTimeFieldsLoaded();
	}

	verifyTimeFieldsLoaded() {
		this.hourField.should('be.visible');
		this.minuteField.should('be.visible');
	}

	enterTime(time: TimeAnswer) {
		this.hourField.clearAndWrite(time.hour);
		this.minuteField.clearAndWrite(time.minute);
	}

	enterDateAndTime(date: DateAnswer, time: TimeAnswer) {
		this.verifyLoaded();
		this.enterTime(time);
		this.enterDate(date);
	}
}
export const workshopDateAndTimePage = new WorkshopDateAndTimePage();
