import { ManageHomePage } from 'cypress/pageObjects/manage/home-page.ts';

const manageHomePage = new ManageHomePage();

describe('Manage Demo Tests', () => {
	it('should load the manage homepage', () => {
		cy.visit('/');
		manageHomePage.verifyMainHeading('Some Service Name');
	});
});
