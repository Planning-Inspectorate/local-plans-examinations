import { portalHeaderAndFooter } from '../../../../page-objects/portal/base/header-and-footer.ts';
import { portalLoginEmailPage } from '../../../../page-objects/portal/login/email-page.ts';

describe('Portal login email page', () => {
	beforeEach(() => {
		portalLoginEmailPage.visit();
	});

	it('displays the sign-in page content', { tags: ['smoke'] }, () => {
		portalLoginEmailPage.verifyHeading('Sign-in');
		portalLoginEmailPage.verifyMainContains('What is your email address');
		portalLoginEmailPage.verifySaveAndContinueVisible();
	});

	it('displays PINS header', { tags: ['smoke'] }, () => {
		portalLoginEmailPage.verifyHeader(
			'Planning Inspectorate',
			'https://www.gov.uk/government/organisations/planning-inspectorate'
		);
	});

	it('displays PINS footer', { tags: ['smoke'] }, () => {
		portalLoginEmailPage.verifyFooter('Contact the Planning Inspectorate', 'tel:+44303 444 5000');
		portalHeaderAndFooter.verifyServiceInformation(
			'Terms and conditions',
			'Accessibility statement',
			'Privacy',
			'Cookies'
		);
	});
});
