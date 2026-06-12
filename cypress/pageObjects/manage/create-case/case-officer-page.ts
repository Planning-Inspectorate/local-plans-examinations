import { BasePage } from '../../base-page.ts';

export class CaseOfficerPage extends BasePage {
	constructor() {
		super('/create-a-case/case-details/case-officer');
	}

	get caseOfficerSelect() {
		return cy.get('#caseOfficer');
	}

	verifyLoaded() {
		this.verifyPath();
		this.verifyHeading('Who is the case officer?');
		this.caseOfficerSelect.should('be.visible');
		this.verifySaveAndContinueVisible();
	}

	selectCaseOfficer(value: string) {
		this.caseOfficerSelect.should('be.visible').select(value);
		this.saveAndContinue();
	}
}

export const caseOfficerPage = new CaseOfficerPage();
