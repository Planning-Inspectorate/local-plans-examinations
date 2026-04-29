import { PortalHomePage } from 'cypress/pageObjects/portal/home-page.ts';

const homePage = new PortalHomePage();
describe('Portal Demo Tests', () => {
	it('should load the portal homepage', () => {
		cy.authVisit('/');
		homePage.verifyHeading('This is the home page');
		//homePage.verifyDbConnection('Suuccessfully connected to the database.');
	});
});
