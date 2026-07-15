/// <reference types="cypress" />

declare global {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace Cypress {
		interface Chainable {
			clearAndWrite(value: string | number): Chainable;
			getByData(selector: string): Chainable;
		}
	}
}

Cypress.Commands.add('getByData', (selector) => cy.get(`[data-cy="${selector}"]`));

Cypress.Commands.add('clearAndWrite', { prevSubject: 'element' }, (subject, value) => {
	const input = cy.wrap(subject).should('be.visible').clear();
	const text = String(value);

	return text ? input.type(text) : input;
});

export {};
