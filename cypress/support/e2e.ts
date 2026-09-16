import 'cypress-axe';
import './commands.ts';
import 'cypress-mochawesome-reporter/register';
import { register as registerCypressGrep } from '@cypress/grep';
import { isMicrosoftAuthCdnError } from './microsoft-auth-errors.js';

registerCypressGrep();

Cypress.on('uncaught:exception', (error) => {
	if (isMicrosoftAuthCdnError(error)) {
		return false;
	}
});
