import { BasePage } from '../../base-page.ts';
import { DateInput } from '../../components/date-input.ts';
import type { DateAnswer } from '../../../types/date.ts';

export class DateQuestionPage extends BasePage {
	private readonly fieldName: string;
	private readonly heading: string;
	private readonly dateInput = new DateInput();

	constructor(path: string | RegExp, fieldName: string, heading: string) {
		super(path);
		this.fieldName = fieldName;
		this.heading = heading;
	}

	verifyLoaded(date?: DateAnswer) {
		super.verifyLoaded();
		this.verifyHeading(this.heading);
		this.dateInput.verifyVisible(this.fieldName);
		this.verifySaveAndContinueVisible();

		if (date) {
			this.dateInput.verifyValues(this.fieldName, date);
		}
	}

	enterDate(date: DateAnswer) {
		this.dateInput.enter(this.fieldName, date);
		this.saveAndContinue();
	}

	clearDate() {
		this.dateInput.clear(this.fieldName);
	}
}
