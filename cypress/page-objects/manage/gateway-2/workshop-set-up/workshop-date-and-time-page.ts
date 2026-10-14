import type { DateAnswer } from '../../../../types/date.ts';
import { workshopSetUp } from '../../../../fixtures/manage/gateway-2.ts';
import { DateQuestionPage } from '../../base/date-question-page.ts';

export type TimeAnswer = {
	hour: string;
	minute: string;
};
const workshopSetUpPath = (path: string) => new RegExp(`^/case/.+/gateway-2/set-up-workshop/workshop/${path}$`);
class WorkshopDateAndTimePage extends DateQuestionPage {
	constructor() {
		super(
			workshopSetUpPath(workshopSetUp.workshopDateAndTime.path),
			workshopSetUp.workshopDateAndTime.fieldNameDate,
			workshopSetUp.workshopDateAndTime.heading
		);
	}
	get hourField() {
		return cy.get(`[name="${workshopSetUp.workshopDateAndTime.fieldNameTime}_hour"]`);
	}

	get minuteField() {
		return cy.get(`[name="${workshopSetUp.workshopDateAndTime.fieldNameTime}_minute"]`);
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
		this.enterTime(time);
		this.enterDate(date);
	}
}
export const workshopDateAndTimePage = new WorkshopDateAndTimePage();
