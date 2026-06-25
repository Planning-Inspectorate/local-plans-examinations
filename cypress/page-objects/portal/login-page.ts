import { BasePage } from '../base-page.ts';

export class PortalLoginPage extends BasePage {
	constructor() {
		super('/login');
	}

	get emailInput() {
		return cy.getByData('email');
	}

	get hintText() {
		return cy.getByData('email-hint');
	}

	enterEmail(email: string) {
		this.emailInput.clear().type(email);
	}
}

export const portalLoginPage = new PortalLoginPage();
