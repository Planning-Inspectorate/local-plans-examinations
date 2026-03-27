// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';
import 'cypress-mochawesome-reporter/register';

let grepTags: string[] = [];

/**
 * Helper to normalize Cypress.env value to string[]
 */
function getTags(value: string | string[] | undefined): string[] {
	if (Array.isArray(value)) return value;
	if (typeof value === 'string') return value.split(',');
	return [];
}

before(function () {
	const envTags = Cypress.env('grepTags');
	grepTags = getTags(envTags);
});

beforeEach(function () {
	const runnable = (this as any).currentTest;
	if (!runnable) return;

	const testTags: string[] = runnable._testConfig?.unverifiedTestConfig?.tags || [];

	if (grepTags.length === 0) return;

	const hasMatch = testTags.some((tag) => grepTags.includes(tag));
	if (!hasMatch) {
		runnable.pending = true;
	}
});
