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

	getReference() {
		return this.caseReference
			.should('be.visible')
			.invoke('text')
			.then((reference) => reference.trim());
	}

	verifyReferenceFormat() {
		this.getReference().should('match', /^PLAN\/\d+$/);
	}
}

export const caseCreatedPage = new CaseCreatedPage();
