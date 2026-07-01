import { BasePage } from '../base-page.ts';

export class ManageHomePage extends BasePage {
	constructor() {
		super('/');
	}

	get createCaseLink() {
		return cy.getByData('create-a-case');
	}

	get noCasesMessage() {
		return cy.getByData('no-cases');
	}

	get casesTable() {
		return cy.getByData('casesTable');
	}

	startCreateCase() {
		this.createCaseLink.should('be.visible').click();
	}

	openCaseByPlanTitle(planTitle: string) {
		this.casesTable.contains('tr', planTitle).find('a').first().click();
	}

	verifyCreateCaseLink(text: string) {
		this.createCaseLink.should('be.visible').and('contain.text', text);
	}

	verifyNoCasesMessage(text: string) {
		this.noCasesMessage.should('be.visible').and('contain.text', text);
	}
}

export const manageHomePage = new ManageHomePage();
