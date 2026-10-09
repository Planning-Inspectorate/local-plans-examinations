import { BasePage } from '../base-page.ts';

export class AssignedToMePage extends BasePage {
	constructor() {
		super('/assigned-to-me');
	}

	get casesTable() {
		return cy.getByData('casesTable');
	}

	verifyLoaded() {
		super.verifyLoaded();
		this.pageHeading.invoke('text').should('match', /^Assigned to .+ \(\d+\)$/);
	}

	openCase(reference: string) {
		this.casesTable.contains('a', reference).should('be.visible').click();
	}

	verifyCaseVisible(reference: string) {
		this.casesTable.contains('a', reference).should('be.visible');
	}

	verifyCaseNotVisible(reference: string) {
		this.mainContent.should('not.contain.text', reference);
	}

	verifyCaseStatus(reference: string, status: string) {
		this.casesTable.contains('tr', reference).find('[data-cy="status-tag"]').should('contain.text', status);
	}
}

export const assignedToMePage = new AssignedToMePage();
