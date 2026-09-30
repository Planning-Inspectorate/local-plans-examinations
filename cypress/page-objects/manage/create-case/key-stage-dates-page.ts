import { BasePage } from '../../base-page.ts';
import { DateInput } from '../../components/date-input.ts';
import type { DateAnswer } from '../../../types/date.ts';
import type { CreateCaseData } from './types.ts';

export class KeyStageDatesPage extends BasePage {
	private readonly dateInput = new DateInput();

	constructor() {
		super('/create-a-case/dates/key-stage-dates');
	}

	verifyKeyStageDatesPopulated(dates: CreateCaseData['dates']) {
		this.dateInput.verifyValues('intentionToCommenceDate', dates.intentionToCommenceDate);
		this.dateInput.verifyValues('gateway1Date', dates.gateway1Date);
		this.dateInput.verifyValues('gateway2Date', dates.gateway2Date);
		this.dateInput.verifyValues('gateway3Date', dates.gateway3Date);
		this.dateInput.verifyValues('expectedSubmissionForExaminationDate', dates.expectedSubmissionForExaminationDate);
	}

	verifyLoaded() {
		super.verifyLoaded();
		this.verifyHeading('Enter dates for key stages of the local plan');
		this.verifyMainContains(
			'Date the Notice of Intention to Commence Plan Making was published',
			'Gateway 1 expected date',
			'Gateway 2 expected date',
			'Gateway 3 expected date',
			'Expected submission for examination date'
		);
		this.dateInput.verifyVisible('intentionToCommenceDate');
		this.dateInput.verifyVisible('gateway1Date');
		this.dateInput.verifyVisible('gateway2Date');
		this.dateInput.verifyVisible('gateway3Date');
		this.dateInput.verifyVisible('expectedSubmissionForExaminationDate');
		this.verifySaveAndContinueVisible();
	}

	enterKeyStageDates(dates: CreateCaseData['dates']) {
		this.dateInput.enter('intentionToCommenceDate', dates.intentionToCommenceDate);
		this.dateInput.enter('gateway1Date', dates.gateway1Date);
		this.dateInput.enter('gateway2Date', dates.gateway2Date);
		this.dateInput.enter('gateway3Date', dates.gateway3Date);
		this.dateInput.enter('expectedSubmissionForExaminationDate', dates.expectedSubmissionForExaminationDate);
		this.saveAndContinue();
	}

	verifyDateInputValidationError(fieldName: string, date: DateAnswer, errorMessage: string) {
		this.dateInput.enter(fieldName, date);
		this.saveAndContinue();
		this.verifyErrorSummaryContains(errorMessage);
	}
}

export const keyStageDatesPage = new KeyStageDatesPage();
