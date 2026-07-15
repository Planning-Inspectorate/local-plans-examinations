import { BasePage } from '../../base-page.ts';
import type { CreateCaseData } from './types.ts';

export class KeyStageDatesPage extends BasePage {
	constructor() {
		super('/create-a-case/dates/key-stage-dates');
	}

	verifyKeyStageDatesPopulated(dates: CreateCaseData['dates']) {
		this.verifyDateInputValues('intentionToCommenceDate', dates.intentionToCommenceDate);
		this.verifyDateInputValues('gateway1Date', dates.gateway1Date);
		this.verifyDateInputValues('gateway2Date', dates.gateway2Date);
		this.verifyDateInputValues('gateway3Date', dates.gateway3Date);
		this.verifyDateInputValues('submissionDate', dates.submissionDate);
	}

	verifyLoaded() {
		super.verifyLoaded();
		this.verifyHeading('Enter dates for key stages of the local plan');
		this.verifyMainContains(
			'Date the Notice of Intention to Commence Plan Making was published',
			'Gateway 1 estimated date',
			'Gateway 2 estimated date',
			'Gateway 3 estimated date',
			'Submission for examination date'
		);
		this.verifyDateInputsVisible('intentionToCommenceDate');
		this.verifyDateInputsVisible('gateway1Date');
		this.verifyDateInputsVisible('gateway2Date');
		this.verifyDateInputsVisible('gateway3Date');
		this.verifyDateInputsVisible('submissionDate');
		this.verifySaveAndContinueVisible();
	}

	enterKeyStageDates(dates: CreateCaseData['dates']) {
		this.enterDateAnswer('intentionToCommenceDate', dates.intentionToCommenceDate);
		this.enterDateAnswer('gateway1Date', dates.gateway1Date);
		this.enterDateAnswer('gateway2Date', dates.gateway2Date);
		this.enterDateAnswer('gateway3Date', dates.gateway3Date);
		this.enterDateAnswer('submissionDate', dates.submissionDate);
		this.saveAndContinue();
	}
}

export const keyStageDatesPage = new KeyStageDatesPage();
