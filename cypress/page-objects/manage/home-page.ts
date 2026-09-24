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

	get assignedToMeLink() {
		return this.serviceNavigation.contains('a', 'Assigned to me');
	}

	startCreateCase() {
		this.createCaseLink.should('be.visible').click();
	}

	openAssignedToMe() {
		this.assignedToMeLink.should('be.visible').and('have.attr', 'href', '/assigned-to-me').click();
	}

	openCaseByPlanTitle(planTitle: string) {
		this.casesTable.contains('tr', planTitle).find('[data-cy="case-reference-link"]').click();
	}

	openCaseByReference(reference: string) {
		this.casesTable.contains('[data-cy="case-reference-link"]', reference).should('be.visible').click();
	}

	verifyCaseStatus(planTitle: string, status: string) {
		this.casesTable.contains('tr', planTitle).find('[data-cy="status-tag"]').should('contain.text', status);
	}

	verifyCreateCaseLink(text: string) {
		this.createCaseLink.should('be.visible').and('contain.text', text);
	}

	verifyNoCasesMessage(text: string) {
		this.noCasesMessage.should('be.visible').and('contain.text', text);
	}

	get caseReference() {
		return cy.getByData('case-reference-link');
	}
	getReference() {
		return this.caseReference
			.should('be.visible')
			.invoke('text')
			.then((reference) => reference.trim());
	}

	verifyReferenceFormat() {
		this.getReference().should('match', /^PLAN-\d+$/);
	}
}

export const manageHomePage = new ManageHomePage();
