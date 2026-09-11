import { BasePage } from '../base-page.ts';

const tableHeadings = ['Case reference', 'Plan title', 'Plan type', 'Case officer', 'Status'];

export class AssignedToMePage extends BasePage {
	constructor() {
		super('/assigned-to-me');
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

	verifyLoaded() {
		super.verifyLoaded();
		this.pageHeading.invoke('text').should('match', /^Assigned to .+ \(\d+\)$/);
	}

	verifyCreateCaseLink() {
		this.createCaseLink
			.should('be.visible')
			.and('contain.text', 'Create a case')
			.and('have.attr', 'href', '/create-a-case/case-details/case-officer');
	}

	verifyTableHeadings() {
		this.casesTable.should('be.visible');

		tableHeadings.forEach((heading) => {
			this.casesTable.contains('th', heading).should('be.visible');
		});
	}

	verifyAssignedCaseForCurrentUser(reference: string, planTitle: string) {
		this.pageHeading.invoke('text').then((headingText) => {
			const headingMatch = headingText.match(/^Assigned to (.+) \(\d+\)$/);
			const caseOfficer = headingMatch?.[1];

			if (!caseOfficer) {
				throw new Error('Assigned to me heading did not include a user name');
			}

			this.casesTable
				.contains('tr', reference)
				.should('be.visible')
				.and('contain.text', planTitle)
				.and('contain.text', 'Local Plan')
				.and('contain.text', caseOfficer)
				.and('contain.text', 'Submitted');
		});
	}

	verifyCaseNotVisible(reference: string) {
		this.mainContent.should('not.contain.text', reference);
	}
}

export const assignedToMePage = new AssignedToMePage();
