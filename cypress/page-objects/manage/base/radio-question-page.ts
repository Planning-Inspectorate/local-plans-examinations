import { BasePage } from '../../base-page.ts';

type RadioOption = {
	value: string;
	text: string;
};

export class RadioQuestionPage extends BasePage {
	fieldName: string;
	heading: string;
	options: RadioOption[];

	constructor(path: string | RegExp, fieldName: string, heading: string, options: RadioOption[]) {
		super(path);
		this.fieldName = fieldName;
		this.heading = heading;
		this.options = options;
	}

	answerOption(value: string) {
		return cy.get(`input[name="${this.fieldName}"][value="${value}"]`);
	}

	answerOptionLabel(value: string) {
		return this.answerOption(value).siblings('label');
	}

	verifyLoaded(value?: string) {
		super.verifyLoaded();
		this.verifyHeading(this.heading);

		this.options.forEach(({ value, text }) => {
			this.answerOptionLabel(value).should('be.visible').and('contain.text', text);
		});

		this.verifySaveAndContinueVisible();

		if (value) {
			this.answerOption(value).should('be.checked');
		}
	}

	selectAnswer(value: string) {
		this.answerOption(value).check({ force: true });
		this.saveAndContinue();
	}
}
