/// <reference types="cypress" />

type DateParts = {
	day: string | number;
	month: string | number;
	year: string | number;
};

declare global {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace Cypress {
		interface Chainable {
			clearAndWrite(value: string | number): Chainable;
			getByData(selector: string): Chainable;
			fillDate(fieldName: string, date: DateParts): Chainable;
		}
	}
}

Cypress.Commands.add('getByData', (selector) => cy.get(`[data-cy="${selector}"]`));

Cypress.Commands.add('clearAndWrite', { prevSubject: 'element' }, (subject, value) => {
	const input = cy.wrap(subject).should('be.visible').clear();
	const text = String(value);

	return text ? input.type(text) : input;
});

Cypress.Commands.add('fillDate', (fieldName, date) => {
	cy.get(`[name="${fieldName}-day"]`).clearAndWrite(date.day);
	cy.get(`[name="${fieldName}-month"]`).clearAndWrite(date.month);
	cy.get(`[name="${fieldName}-year"]`).clearAndWrite(date.year);
});

export {};
