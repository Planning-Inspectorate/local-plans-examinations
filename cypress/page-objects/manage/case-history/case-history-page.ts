import { BasePage } from '../../base-page.ts';

export class CaseHistoryPage extends BasePage {
	constructor() {
		super(/^\/case\/.+\/overview$/);
	}

	get table() {
		return cy.getByData('case-history-table');
	}

	verifyLoaded() {
		super.verifyLoaded();
		this.verifySearch('?section=case-history');
		cy.contains('h2', 'Case history').should('be.visible');
	}

	verifyTableHeadings() {
		this.table.find('thead th').should('have.length', 3);
		this.table.find('thead').within(() => {
			cy.contains('th', 'Date').should('be.visible');
			cy.contains('th', 'Event').should('be.visible');
			cy.contains('th', 'User').should('be.visible');
		});
	}

	verifyCaseCreatedHistory(planTitle: string, user = 'Unknown') {
		const event = `Case created for plan ${planTitle}`;

		this.table.within(() => {
			cy.getByData('case-history-date').first().should('contain.text', new Date().getFullYear().toString());
			cy.getByData('case-history-event').should('contain.text', event);
			cy.getByData('case-history-user').should('contain.text', user);
		});
	}
}

export const caseHistoryPage = new CaseHistoryPage();
