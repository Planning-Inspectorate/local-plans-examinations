import { manageHomePage } from '../../../pageObjects/manage/home-page.ts';

describe('Manage home', () => {
	it('loads the manage service homepage', { tags: ['smoke'] }, () => {
		manageHomePage.visit();
		manageHomePage.verifyHeading('All cases');
		manageHomePage.verifyCreateCaseLink('Create a case');
	});
});
