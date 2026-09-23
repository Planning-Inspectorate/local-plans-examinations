import { PortalPlanBasePage } from '../../../page-objects/portal/base/portal-plan-page.ts';

export class SingleLineInputPage extends PortalPlanBasePage {
	private readonly fieldName: string;
	private readonly heading: string;
	readonly addCy: string;

	constructor(path: string | RegExp, fieldName: string, heading: string, addCy: string) {
		super(path);
		this.fieldName = fieldName;
		this.heading = heading;
		this.addCy = addCy;
	}

	get hintText() {
		return cy.get(`#${this.fieldName}-hint`);
	}

	get answerInput() {
		return cy.get(`#${this.fieldName}`);
	}

	verifyHintText(text: string) {
		this.hintText.should('be.visible').and('contain.text', text);
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
