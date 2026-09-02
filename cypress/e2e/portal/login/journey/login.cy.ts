import { portalLoginEmailPage } from '../../../../page-objects/portal/login/email-page.ts';
import { completePortalLogin, startPortalOtpLogin } from '../../../../flows/portal/login-flow.ts';
import { portalLandingPage } from '../../../../page-objects/portal/landing-page.ts';
import { portalLoginOtpPage } from '../../../../page-objects/portal/login/otp-page.ts';
import { planDetailsPage } from '../../../../page-objects/portal/plan-details/plan-details-page.ts';
import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');

describe('Portal login journey', () => {
	it('shows page not found when accessing the OTP page directly without a session', { tags: ['regression'] }, () => {
		cy.visit('/login/enter-code', { failOnStatusCode: false });
		portalLoginOtpPage.verifyPageNotFound('/login/enter-code');
	});

	it('redirects to the OTP page after a recognised email is submitted', { tags: ['smoke'] }, () => {
		startPortalOtpLogin();

		portalLoginOtpPage.verifyPath();
	});

	it('logs in and shows the landing page', { tags: ['smoke'] }, () => {
		startPortalOtpLogin();
		portalLoginOtpPage.verifyPath();

		completePortalLogin();

		portalLandingPage.verifyLoaded();
		portalLandingPage.verifyHeading('My plans');
	});

	it('user cannot access OPT page by using back link and typing in url', { tags: ['regression'] }, () => {
		startPortalOtpLogin();
		portalLoginOtpPage.verifyLoaded();
		portalLoginOtpPage.goBack();
		cy.visit('/login/enter-code', { failOnStatusCode: false });
		portalLoginOtpPage.verifyPageNotFound('/login/enter-code');
	});

	it('user is redirected to /login page when trying to access Portal urls directly', { tags: ['regression'] }, () => {
		portalLandingPage.visit();
		portalLoginEmailPage.verifyLoaded();
	});

	it('logged in user is not redirected to /login', { tags: ['regression'] }, () => {
		startPortalOtpLogin();
		portalLoginOtpPage.verifyPath();
		completePortalLogin();

		loadPlanDetails().then((plan) => {
			portalLandingPage.openPlan(plan.reference);
			planDetailsPage.verifyPathForPlan(encodeURIComponent(plan.reference));

			portalLandingPage.visit();

			planDetailsPage.verifyLoaded();
		});
	});

	it.skip('requests a new code from the OTP page', { tags: ['notify'] }, () => {
		startPortalOtpLogin();
		portalLoginOtpPage.verifyPath();

		portalLoginOtpPage.clickRequestNewCode();

		portalLoginOtpPage.verifyNewCodeBanner();
	});
});
