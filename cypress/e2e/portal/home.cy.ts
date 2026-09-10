import { authenticatePortalIfRequired } from '../../flows/auth-flow.ts';
import { portalHomePage } from '../../page-objects/portal/home-page.ts';

describe('Portal home', () => {
	before(() => {
		authenticatePortalIfRequired();
	});

	it('loads the portal service homepage', { tags: ['smoke', 'environment-smoke'] }, () => {
		portalHomePage.visit();
		portalHomePage.verifyHeading('This is the home page');
		portalHomePage.verifyDbConnection('Successfully connected to the database.');
	});
});
