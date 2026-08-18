/// <reference types="cypress" />

import type { Result } from 'axe-core';

declare global {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace Cypress {
		interface Chainable {
			clearAndWrite(value: string | number): Chainable;
			getByData(selector: string): Chainable;
			checkAccessibility(context?: string): Chainable<void>;
		}
	}
}

Cypress.Commands.add('getByData', (selector) => cy.get(`[data-cy="${selector}"]`));

Cypress.Commands.add('clearAndWrite', { prevSubject: 'element' }, (subject, value) => {
	const input = cy.wrap(subject).should('be.visible').clear();
	const text = String(value);

	return text ? input.type(text) : input;
});

const logAccessibilityViolations = (violations: Result[]) => {
	cy.task('log', `${violations.length} accessibility violation${violations.length === 1 ? '' : 's'} detected`);
	cy.task(
		'table',
		violations.map(({ id, impact, description, nodes }) => ({
			id,
			impact,
			description,
			nodes: nodes.length,
			targets: nodes.map(({ target }) => target.join(', ')).join('\n')
		}))
	);
};

const wcag22LevelAATags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

Cypress.Commands.add('checkAccessibility', (context?: string) => {
	cy.injectAxe();
	cy.checkA11y(
		context,
		{
			runOnly: {
				type: 'tag',
				values: wcag22LevelAATags
			}
		},
		logAccessibilityViolations
	);
});

export {};
