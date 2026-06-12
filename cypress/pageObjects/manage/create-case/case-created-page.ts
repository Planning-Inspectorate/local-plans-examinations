import { BasePage } from '../../base-page.ts';

export class CaseCreatedPage extends BasePage {
	get createdPanel() {
		return cy.getByData('case-created-panel');
	}

	get caseReference() {
		return cy.getByData('case-reference');
	}

	verifyLoaded() {
		this.createdPanel.should('be.visible').and('contain.text', 'New case has been created');
	}

	verifyReferenceFormat() {
		this.caseReference
			.should('be.visible')
			.invoke('text')
			.should('match', /^PLAN\/\d+$/);
	}
}

export const caseCreatedPage = new CaseCreatedPage();
