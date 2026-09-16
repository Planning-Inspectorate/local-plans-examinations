import { BasePage } from '../../base-page.ts';
import type { SelectAnswer } from './types.ts';

export class CaseOfficerPage extends BasePage {
	constructor() {
		super('/create-a-case/case-details/case-officer');
	}

	get caseOfficerSelect() {
		return cy.get('#caseOfficer');
	}

	caseOfficerOption(value: string) {
		return cy.getByData(`answer-${value}`);
	}

	verifyLoaded() {
		super.verifyLoaded();
		this.verifyHeading('Who is the case officer?');
		this.caseOfficerSelect.should('be.visible');
		this.verifySaveAndContinueVisible();
	}

	selectCaseOfficer(value: string) {
		this.caseOfficerSelect.should('be.visible').select(value);
		this.saveAndContinue();
	}

	selectFirstCaseOfficer(): Cypress.Chainable<SelectAnswer> {
		return this.caseOfficerSelect
			.should('be.visible')
			.find('option')
			.not('[value=""]')
			.first()
			.then(($option) => {
				const value = $option.attr('value');
				if (!value) {
					throw new Error('No selectable case officer option was found');
				}
				const label = $option.text().trim();
				return { label, value };
			})
			.then((caseOfficer) => {
				this.caseOfficerSelect.select(caseOfficer.value);
				this.saveAndContinue();
				return cy.wrap(caseOfficer, { log: false });
			});
	}

	verifyCaseOfficerSelected(value: string) {
		this.caseOfficerOption(value).should('have.attr', 'selected');
	}

	verifyNoCaseOfficerSelected() {
		this.caseOfficerSelect.should('have.value', '');
	}
}

export const caseOfficerPage = new CaseOfficerPage();
