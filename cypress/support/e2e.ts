import 'cypress-axe';
import './commands.ts';
import 'cypress-mochawesome-reporter/register';
import { register as registerCypressGrep } from '@cypress/grep';

registerCypressGrep();

Cypress.on('uncaught:exception', (error) => {
	if (error.message.includes('aadcdn.msauth.net') || error.message.includes('aadcdn.msftauth.net')) {
		return false;
	}
});
