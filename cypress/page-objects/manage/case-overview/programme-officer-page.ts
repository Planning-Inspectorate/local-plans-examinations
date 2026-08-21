import { BasePage } from '../../base-page.ts';
import { programmeOfficer } from '../../../fixtures/manage/overview.ts';

export class CaseOverviewProgrammeOfficerPage extends BasePage {
	constructor() {
		super(/^\/case\/.+\/overview\/contacts\/programme-officer$/);
	}

	get programmeOfficerFirstNameInput() {
		return cy.get(`input[name="${programmeOfficer.fieldFirstName}"]`);
	}

	get programmeOfficerLastNameInput() {
		return cy.get(`input[name="${programmeOfficer.fieldLastName}"]`);
	}

	get programmeOfficerEmailInput() {
		return cy.get(`input[name="${programmeOfficer.fieldEmail}"]`);
	}

	verifyLoaded(firstName = '', lastName = '', email = '') {
		super.verifyLoaded();
		this.verifyHeading(programmeOfficer.heading);
		this.programmeOfficerFirstNameInput.should('be.visible').and('have.value', firstName);
		this.programmeOfficerLastNameInput.should('be.visible').and('have.value', lastName);
		this.programmeOfficerEmailInput.should('be.visible').and('have.value', email);
		this.verifySaveAndContinueVisible();
	}

	enterProgrammeOfficerDetails(firstName: string, lastName: string, email: string) {
		this.programmeOfficerFirstNameInput.clearAndWrite(firstName);
		this.programmeOfficerLastNameInput.clearAndWrite(lastName);
		this.programmeOfficerEmailInput.clearAndWrite(email);
		this.saveAndContinue();
	}
}

export const caseOverviewProgrammeOfficerPage = new CaseOverviewProgrammeOfficerPage();
