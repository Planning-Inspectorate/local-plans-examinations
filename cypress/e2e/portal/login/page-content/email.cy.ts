import { portalLoginEmailPage } from '../../../../page-objects/portal/login/email-page.ts';

describe('Portal login email page', () => {
	beforeEach(() => {
		portalLoginEmailPage.visit();
	});

	it('displays the sign-in page content', { tags: ['smoke'] }, () => {
		portalLoginEmailPage.verifyHeading('What is your email address?');
		portalLoginEmailPage.verifySaveAndContinueVisible();
	});
});
