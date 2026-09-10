import { authenticateManageIfRequired } from '../../../flows/auth-flow.ts';
import { manageHomePage } from '../../../page-objects/manage/home-page.ts';

describe('Manage home', () => {
	before(() => {
		authenticateManageIfRequired();
	});

	it('loads the manage service homepage', { tags: ['smoke', 'environment-smoke'] }, () => {
		manageHomePage.visit();
		manageHomePage.verifyHeading('All cases');
		manageHomePage.verifyCreateCaseLink('Create a case');
	});
});
