import { BasePage } from '../../base-page.ts';
import type { CreateCaseData } from './types.ts';

export class KeyStageDatesPage extends BasePage {
	constructor() {
		super('/create-a-case/dates/key-stage-dates');
	}

	dateInput(fieldName: keyof CreateCaseData['dates'], part: 'day' | 'month' | 'year') {
		return cy.get(`[name="${fieldName}-${part}"]`);
	}

	verifyDateInputsVisible(fieldName: keyof CreateCaseData['dates']) {
		this.dateInput(fieldName, 'day').should('be.visible');
		this.dateInput(fieldName, 'month').should('be.visible');
		this.dateInput(fieldName, 'year').should('be.visible');
	}

	verifyDateInputValues(
		fieldName: keyof CreateCaseData['dates'],
		date: CreateCaseData['dates'][keyof CreateCaseData['dates']]
	) {
		this.dateInput(fieldName, 'day').should('have.value', date.day);
		this.dateInput(fieldName, 'month').should('have.value', date.month);
		this.dateInput(fieldName, 'year').should('have.value', date.year);
	}

	verifyKeyStageDatesPopulated(dates: CreateCaseData['dates']) {
		this.verifyDateInputValues('intentionToCommenceDate', dates.intentionToCommenceDate);
		this.verifyDateInputValues('gateway1Date', dates.gateway1Date);
		this.verifyDateInputValues('gateway2Date', dates.gateway2Date);
		this.verifyDateInputValues('gateway3Date', dates.gateway3Date);
		this.verifyDateInputValues('submissionDate', dates.submissionDate);
	}

	verifyLoaded() {
		this.verifyPath();
		this.verifyHeading('Enter dates for key stages of the local plan');
		this.verifyMainContains(
			'Date the Notice of Intention to Commence Plan Making was published',
			'Gateway 1 estimated date',
			'Gateway 2 estimated date',
			'Gateway 3 estimated date',
			'Submission for examination date'
		);
		this.verifyDateInputsVisible('intentionToCommenceDate');
		this.verifyDateInputsVisible('gateway1Date');
		this.verifyDateInputsVisible('gateway2Date');
		this.verifyDateInputsVisible('gateway3Date');
		this.verifyDateInputsVisible('submissionDate');
		this.verifySaveAndContinueVisible();
	}

	enterKeyStageDates(dates: CreateCaseData['dates']) {
		cy.fillDate('intentionToCommenceDate', dates.intentionToCommenceDate);
		cy.fillDate('gateway1Date', dates.gateway1Date);
		cy.fillDate('gateway2Date', dates.gateway2Date);
		cy.fillDate('gateway3Date', dates.gateway3Date);
		cy.fillDate('submissionDate', dates.submissionDate);
		this.saveAndContinue();
	}
}

export const keyStageDatesPage = new KeyStageDatesPage();
