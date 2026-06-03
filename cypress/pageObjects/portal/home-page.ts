import { BasePage } from '../base-page.ts';

export class PortalHomePage extends BasePage {
	constructor() {
		super('/');
	}

	get dbConnectionMessage() {
		return cy.getByData('db-connection');
	}

	verifyDbConnection(text: string) {
		this.dbConnectionMessage.should('be.visible').and('contain.text', text);
	}
}

export const portalHomePage = new PortalHomePage();
