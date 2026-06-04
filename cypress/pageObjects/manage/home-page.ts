import { BasePage } from '../base-page.ts';

export class ManageHomePage extends BasePage {
	constructor() {
		super('/items');
	}

	get createBasicCaseLink() {
		return cy.getByData('create-basic-case');
	}

	startCreateCase() {
		this.createBasicCaseLink.should('be.visible').click();
	}

	verifyCreateBasicCaseLink(text: string) {
		this.createBasicCaseLink.should('be.visible').and('contain.text', text);
	}
}

export const manageHomePage = new ManageHomePage();
