import { PortalHomePage } from 'cypress/pageObjects/portal/home-page.ts';

const homePage = new PortalHomePage();
describe('Portal Demo Tests', () => {
	it('should load the portal homepage', () => {
		cy.visit('/');
		homePage.verifyHeading('Local Plans Examination Service');
		homePage.verifyDbConnection('Successfully connected to the database.');
	});
});
