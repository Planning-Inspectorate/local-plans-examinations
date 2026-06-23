import { BasePage } from '../base-page.ts';

export class ManageHomePage extends BasePage {
	constructor() {
		super('/');
	}

	get createCaseLink() {
		return cy.getByData('create-a-case');
	}

	startCreateCase() {
		this.createCaseLink.should('be.visible').click();
	}

	verifyCreateCaseLink(text: string) {
		this.createCaseLink.should('be.visible').and('contain.text', text);
	}
}

export const manageHomePage = new ManageHomePage();
