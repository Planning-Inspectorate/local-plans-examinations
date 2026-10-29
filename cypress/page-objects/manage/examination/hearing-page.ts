import { DateQuestionPage } from '../base/date-question-page.ts';
import { RadioQuestionPage } from '../base/radio-question-page.ts';
import { SingleLineInputPage } from '../base/single-line-input-page.ts';
import { GatewayBasePage } from '../base/gateway-page.ts';
import { BasePage } from '../../../page-objects/base-page.ts';
import type { TimeAnswer } from '../gateway-2/workshop-set-up/workshop-date-and-time-page.ts';
import type { DateAnswer } from '../../../types/date.ts';

const hearingPath = (path: string) => RegExp(`^/case/.+/examination/set-up-hearing/hearing/${path}$`);
const cyaPath = (path: string) => RegExp(`^/case/.+/examination/set-up-hearing/${path}$`);

export class HearingDateAndTimePage extends DateQuestionPage {
	private readonly timeFieldName: string;

	constructor(hearingNumber = 1) {
		super(
			hearingPath(`examination-hearing-date-and-time-${hearingNumber}`),
			`hearingDate-${hearingNumber}`,
			'Hearing date and time'
		);
		this.timeFieldName = `hearingTime-${hearingNumber}`;
	}
	get hourField() {
		return cy.get(`[name="${this.timeFieldName}_hour"]`);
	}

	get minuteField() {
		return cy.get(`[name="${this.timeFieldName}_minute"]`);
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

export class HearingCheckPage extends GatewayBasePage {
	constructor(hearingNumber = 1) {
		super(cyaPath(`check-your-answers-${hearingNumber}`));
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

class CancelHearingPage extends BasePage {
	constructor() {
		super(/^\/case\/.+\/examination\/set-up-hearing\/delete-1$/);
	}
	get cancelHearingBtn() {
		return cy.getByData('cancelHearingBtn');
	}

	get doNotCancelBtn() {
		return cy.getByData('doNotCancelBtn');
	}

	confirmCancelHearing() {
		this.verifyLoaded();
		this.cancelHearingBtn.should('be.visible').and('contain.text', 'Cancel hearing').click();
	}

	verifyLoaded() {
		super.verifyLoaded();
		this.cancelHearingBtn.should('be.visible').and('contain.text', 'Cancel hearing');
		this.doNotCancelBtn.should('be.visible').and('contain.text', 'Do not cancel');
		super.verifyHeading('Are you sure you want to cancel the hearing?');
		super.verifyMainContains('This will remove all hearing details including date, time, venue, and estimates.');
	}
}

export class HearingExpectedDaysPage extends RadioQuestionPage {
	constructor(hearingNumber = 1) {
		super(
			hearingPath(`examination-hearing-expected-days-${hearingNumber}`),
			`hearingExpectedDaysKnown-${hearingNumber}`,
			'Do you know the expected number of days to carry out the hearing?',
			[
				{ value: 'yes', text: 'Yes' },
				{ value: 'no', text: 'No' }
			]
		);
	}
}

export class RemoteOrInPersonPage extends RadioQuestionPage {
	constructor(hearingNumber = 1) {
		super(
			hearingPath(`examination-hearing-location-type-${hearingNumber}`),
			`hearingLocationType-${hearingNumber}`,
			'Is the hearing in-person, hybrid or remote?',
			[
				{ value: 'in-person', text: 'In-person' },
				{ value: 'hybrid', text: 'Hybrid' },
				{ value: 'remote', text: 'Remote' }
			]
		);
	}
}

export class RemoteLinkPage extends SingleLineInputPage {
	constructor(hearingNumber = 1) {
		super(
			hearingPath(`examination-hearing-remote-meeting-link-${hearingNumber}`),
			`hearingRemoteMeetingLink-${hearingNumber}`,
			'What is the remote meeting link?'
		);
	}
}

export class MeetingLinkKnownPage extends RadioQuestionPage {
	constructor(hearingNumber = 1) {
		super(
			hearingPath(`examination-hearing-remote-meeting-link-known-${hearingNumber}`),
			`hearingRemoteMeetingLinkKnown-${hearingNumber}`,
			'Do you have a remote meeting link?',
			[
				{ value: 'yes', text: 'Yes' },
				{ value: 'no', text: 'No' }
			]
		);
	}
}

export const cancelHearingPage = new CancelHearingPage();
export const hearingDateAndTimePage = new HearingDateAndTimePage();
export const hearingCheckPage = new HearingCheckPage();
export const hearingExpectedDaysPage = new HearingExpectedDaysPage();
