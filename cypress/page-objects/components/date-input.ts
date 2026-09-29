import type { DateAnswer } from '../../types/date.ts';

export class DateInput {
	input(fieldName: string, part: keyof DateAnswer) {
		return cy.get(`[name="${fieldName}-${part}"], [name="${fieldName}_${part}"]`);
	}

	verifyVisible(fieldName: string) {
		this.input(fieldName, 'day').should('be.visible');
		this.input(fieldName, 'month').should('be.visible');
		this.input(fieldName, 'year').should('be.visible');
	}

	verifyValues(fieldName: string, date: DateAnswer) {
		this.input(fieldName, 'day').should('have.value', date.day);
		this.input(fieldName, 'month').should('have.value', date.month);
		this.input(fieldName, 'year').should('have.value', date.year);
	}

	enter(fieldName: string, date: DateAnswer) {
		this.input(fieldName, 'day').clearAndWrite(date.day);
		this.input(fieldName, 'month').clearAndWrite(date.month);
		this.input(fieldName, 'year').clearAndWrite(date.year);
	}

	clear(fieldName: string) {
		this.input(fieldName, 'day').clear();
		this.input(fieldName, 'month').clear();
		this.input(fieldName, 'year').clear();
	}
}
