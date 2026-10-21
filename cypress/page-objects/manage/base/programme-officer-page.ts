import { BasePage } from '../../base-page.ts';

export class ProgrammeOfficerPage extends BasePage {
	private readonly heading: string;

	constructor(path: string | RegExp, heading: string) {
		super(path);
		this.heading = heading;
	}

	get programmeOfficerFirstNameInput() {
		return cy.getByData('programme-officer-first-name');
	}

	get programmeOfficerLastNameInput() {
		return cy.getByData('programme-officer-last-name');
	}

	get programmeOfficerEmailInput() {
		return cy.getByData('programme-officer-email');
	}

	verifyLoaded(firstName = '', lastName = '', email = '') {
		super.verifyLoaded();
		this.verifyHeading(this.heading);
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
