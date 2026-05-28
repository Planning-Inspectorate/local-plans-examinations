/// <reference types="cypress" />
/* eslint-disable @typescript-eslint/no-namespace */

declare global {
	namespace Cypress {
		interface Chainable {
			authVisit(endpoint: string): Chainable<void>;
		}
	}
}

export {};
