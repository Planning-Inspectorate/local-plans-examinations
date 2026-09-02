import { BasePage } from '../../base-page.ts';

export class SingleLineInputPage extends BasePage {
	fieldName: string;
	heading: string;

	constructor(path: string | RegExp, fieldName: string, heading: string) {
		super(path);
		this.fieldName = fieldName;
		this.heading = heading;
	}

	get answerInput() {
		return cy.get(`#${this.fieldName}`);
	}

	verifyLoaded(value?: string) {
		super.verifyLoaded();
		this.verifyHeading(this.heading);
		this.answerInput.should('be.visible');
		this.verifySaveAndContinueVisible();

		if (value !== undefined) {
			this.answerInput.should('have.value', value);
		}
	}

	fillAnswer(value: string) {
		this.answerInput.clearAndWrite(value);
	}

	enterAnswer(value: string) {
		this.fillAnswer(value);
		this.saveAndContinue();
	}
}
