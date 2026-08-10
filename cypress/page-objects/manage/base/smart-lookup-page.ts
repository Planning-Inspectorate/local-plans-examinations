import { BasePage } from '../../base-page.ts';

export class SmartLookupPage extends BasePage {
	private readonly fieldId: string;
	private readonly listBoxId: string;
	private readonly heading: string;

	constructor(path: string | RegExp, fieldId: string, heading: string) {
		super(path);
		this.fieldId = fieldId;
		this.listBoxId = `${fieldId}__listbox`;
		this.heading = heading;
	}

	get smartLookupInput() {
		return cy.get(`#${this.fieldId}`);
	}

	verifyLoaded() {
		super.verifyLoaded();
		this.verifyHeading(this.heading);
		this.smartLookupInput.should('be.visible');
		this.verifySaveAndContinueVisible();
	}

	enterLookupAnswer(answer: string) {
		this.enterSmartLookUp(this.fieldId, this.listBoxId, answer);
		this.saveAndContinue();
	}

	verifyLookupAnswer(answer: string) {
		this.smartLookUpPopulated(this.fieldId, answer);
	}

	clearLookupAnswer() {
		this.smartLookupInput.clearAndWrite('');
	}
}
