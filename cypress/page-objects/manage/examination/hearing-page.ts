import { DateQuestionPage } from '../base/date-question-page.ts';
import { RadioQuestionPage } from '../base/radio-question-page.ts';
import { GatewayBasePage } from '../base/gateway-page.ts';
import type { TimeAnswer } from '../gateway-2/workshop-set-up/workshop-date-and-time-page.ts';
import type { DateAnswer } from '../../../types/date.ts';

class HearingDateAndTimePage extends DateQuestionPage {
	constructor() {
		super(
			/^\/case\/.+\/examination\/set-up-hearing\/hearing\/examination-hearing-date-and-time-1$/,
			'hearingDate-1',
			'Hearing date and time'
		);
	}

	get hourField() {
		return cy.get('[name="hearingTime-1_hour"]');
	}

	get minuteField() {
		return cy.get('[name="hearingTime-1_minute"]');
	}

	enterDateAndTime(date: DateAnswer, time: TimeAnswer) {
		this.verifyLoaded();
		this.hourField.clearAndWrite(time.hour);
		this.minuteField.clearAndWrite(time.minute);
		this.enterDate(date);
	}

	verifyAnswers(date: DateAnswer, time: TimeAnswer) {
		this.verifyLoaded(date);
		this.hourField.should('have.value', time.hour);
		this.minuteField.should('have.value', time.minute);
	}

	verifyTimeValidationError() {
		this.verifyValidationError('Enter a valid time');
		this.errorSummaryList.find('a').should('have.length', 1).and('have.attr', 'href', '#hearingTime-1_hour');
	}
}

class HearingCheckPage extends GatewayBasePage {
	constructor() {
		super(/^\/case\/.+\/examination\/set-up-hearing\/check-your-answers-1$/);
	}

	get confirmButton() {
		return cy.getByData('submit-case');
	}

	verifyLoaded() {
		super.verifyLoaded();
		this.verifyHeading('Check your answers');
		this.confirmButton.should('be.visible');
	}

	confirmHearing() {
		this.verifyLoaded();
		this.confirmButton.should('contain.text', 'Confirm and save').click();
	}
}

export const hearingDateAndTimePage = new HearingDateAndTimePage();
export const hearingCheckPage = new HearingCheckPage();
export const hearingExpectedDaysPage = new RadioQuestionPage(
	/^\/case\/.+\/examination\/set-up-hearing\/hearing\/examination-hearing-expected-days-1$/,
	'hearingExpectedDaysKnown-1',
	'Do you know the expected number of days to carry out the hearing?',
	[
		{ value: 'yes', text: 'Yes' },
		{ value: 'no', text: 'No' }
	]
);
