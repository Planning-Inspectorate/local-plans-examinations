import { BasePage } from '../../base-page.ts';

export class CaseOverviewProgrammeOfficerPage extends BasePage {
	constructor() {
		super(/^\/case\/.+\/overview\/contacts\/programme-officer$/);
	}

	get programmeOfficerInput() {
		return cy.get('input[name="programmeOfficer"]');
	}

	verifyLoaded() {
		super.verifyLoaded();
		this.verifyHeading('Who is the programme officer?');
		this.programmeOfficerInput.should('be.visible').and('have.value', '');
		this.verifySaveAndContinueVisible();
	}

	enterProgrammeOfficer(value: string) {
		this.programmeOfficerInput.clearAndWrite(value);
		this.saveAndContinue();
	}
}

export const caseOverviewProgrammeOfficerPage = new CaseOverviewProgrammeOfficerPage();
