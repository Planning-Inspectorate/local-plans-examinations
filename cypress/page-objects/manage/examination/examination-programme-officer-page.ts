import { ProgrammeOfficerPage } from '../base/index.ts';
import { programmeOfficer } from '../../../fixtures/manage/examination.ts';

// The Examination tab is the only place the programme officer phone number is asked for
export class ExaminationProgrammeOfficerPage extends ProgrammeOfficerPage {
	get programmeOfficerPhoneInput() {
		return cy.getByData('programme-officer-phone');
	}

	verifyLoaded(firstName = '', lastName = '', email = '', phone = '') {
		super.verifyLoaded(firstName, lastName, email);
		this.programmeOfficerPhoneInput.should('be.visible').and('have.value', phone);
	}

	enterProgrammeOfficerDetails(firstName: string, lastName: string, email: string, phone = '') {
		this.programmeOfficerFirstNameInput.clearAndWrite(firstName);
		this.programmeOfficerLastNameInput.clearAndWrite(lastName);
		this.programmeOfficerEmailInput.clearAndWrite(email);
		this.programmeOfficerPhoneInput.clearAndWrite(phone);
		this.saveAndContinue();
	}
}

export const examinationProgrammeOfficerPage = new ExaminationProgrammeOfficerPage(
	new RegExp(`^/case/.+/examination/examination/${programmeOfficer.path}$`),
	programmeOfficer.heading
);
