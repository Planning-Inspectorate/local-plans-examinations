import { portalHomePage } from '../../page-objects/portal/home-page.ts';

describe('Portal home', () => {
	it('loads the portal service homepage', { tags: ['smoke'] }, () => {
		portalHomePage.visit();
		portalHomePage.verifyHeading('This is the home page');
		portalHomePage.verifyDbConnection('Successfully connected to the database.');
	});
});
