import { BasePage } from '../base-page.ts';

export class PortalLoginPage extends BasePage {
	constructor() {
		super('/login');
	}

	get emailInput() {
		return cy.get('#email');
	}

	get hintText() {
		return cy.get('.govuk-body');
	}

	enterEmail(email: string) {
		this.emailInput.clear().type(email);
	}
}

export const portalLoginPage = new PortalLoginPage();
