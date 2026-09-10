import { authenticatePortalIfRequired } from '../../../../flows/auth-flow.ts';
import { portalLoginEmailPage } from '../../../../page-objects/portal/login/email-page.ts';

describe('Portal login email page', () => {
	before(() => {
		authenticatePortalIfRequired();
	});

	beforeEach(() => {
		portalLoginEmailPage.visit();
	});

	it('displays the sign-in page content', { tags: ['smoke', 'environment-smoke'] }, () => {
		portalLoginEmailPage.verifyHeading('Sign-in');
		portalLoginEmailPage.verifyMainContains('What is your email address');
		portalLoginEmailPage.verifySaveAndContinueVisible();
	});
});
