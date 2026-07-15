import { BasePage } from '../../base-page.ts';
import type { DateAnswer } from '../../../types/date.ts';

export class DateQuestionPage extends BasePage {
	private readonly fieldName: string;
	private readonly heading: string;

	constructor(path: string | RegExp, fieldName: string, heading: string) {
		super(path);
		this.fieldName = fieldName;
		this.heading = heading;
	}

	verifyLoaded(date?: DateAnswer) {
		super.verifyLoaded();
		this.verifyHeading(this.heading);
		this.verifyDateInputsVisible(this.fieldName);
		this.verifySaveAndContinueVisible();

		if (date) {
			this.verifyDateInputValues(this.fieldName, date);
		}
	}

	enterDate(date: DateAnswer) {
		this.enterDateAnswer(this.fieldName, date);
		this.saveAndContinue();
	}

	clearDate() {
		this.clearDateInputs(this.fieldName);
	}
}
