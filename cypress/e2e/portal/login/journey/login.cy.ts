import { portalLoginEmailPage } from '../../../../page-objects/portal/login/email-page.ts';
import { completePortalLogin, portalLogin, startPortalOtpLogin } from '../../../../flows/portal/login-flow.ts';
import { isEnvironmentSmoke } from '../../../../flows/auth-flow.ts';
import { preparePlanDetails } from '../../../../flows/portal/plan-flow.ts';
import { myPlansPage } from '../../../../page-objects/portal/my-plans-page.ts';
import { portalLoginOtpPage } from '../../../../page-objects/portal/login/otp-page.ts';
import { planDetailsPage } from '../../../../page-objects/portal/plan-details/plan-details-page.ts';
import { gateway2ApplicationPage } from '../../../../page-objects/portal/gw2-application/gateway-2-application-page.ts';
import type { PlanDetailsFixture } from '../../../../fixtures/portal/types.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');

describe('Portal login journey', () => {
	afterEach(() => {
		const portalSmokeCaseReference = Cypress.env('portalSmokeCaseReference');

		if (isEnvironmentSmoke() && portalSmokeCaseReference) {
			cy.task('softDeleteCaseByReference', portalSmokeCaseReference);
			Cypress.env('portalSmokeCaseReference', null);
		}
	});

	it('shows page not found when accessing the OTP page directly without a session', { tags: ['regression'] }, () => {
		cy.visit('/login/enter-code', { failOnStatusCode: false });
		portalLoginOtpPage.verifyPageNotFound('/login/enter-code');
	});

	it('redirects to the OTP page after a recognised email is submitted', { tags: ['smoke'] }, () => {
		startPortalOtpLogin();

		portalLoginOtpPage.verifyPath();
	});

	it('logs in and shows the my plans page', { tags: ['smoke', 'environment-smoke'] }, () => {
		if (isEnvironmentSmoke()) {
			preparePlanDetails().then((plan) => {
				Cypress.env('portalSmokeCaseReference', plan.reference);
			});
			portalLogin();
			myPlansPage.verifyLoaded();
			myPlansPage.verifyHeading('My plans');
			return;
		}

		startPortalOtpLogin();
		portalLoginOtpPage.verifyPath();

		completePortalLogin();

		myPlansPage.verifyLoaded();
		myPlansPage.verifyHeading('My plans');
	});

	it('user cannot access OPT page by using back link and typing in url', { tags: ['regression'] }, () => {
		startPortalOtpLogin();
		portalLoginOtpPage.verifyLoaded();
		portalLoginOtpPage.goBack();
		cy.visit('/login/enter-code', { failOnStatusCode: false });
		portalLoginOtpPage.verifyPageNotFound('/login/enter-code');
	});

	it('user is redirected to /login page when trying to access Portal urls directly', { tags: ['regression'] }, () => {
		myPlansPage.visit();
		portalLoginEmailPage.verifyLoaded();
	});

	it('logged in user is not redirected to /login', { tags: ['regression'] }, () => {
		startPortalOtpLogin();
		portalLoginOtpPage.verifyPath();
		completePortalLogin();

		loadPlanDetails().then((plan) => {
			myPlansPage.openPlan(plan.reference);
			planDetailsPage.verifyPathForPlan(encodeURIComponent(plan.reference));

			myPlansPage.visit();
			myPlansPage.verifyLoaded();
		});
	});

	it('user is taken to the login page if they click sign out', { tags: ['regression'] }, () => {
		preparePlanDetails().then((plan) => {
			portalLogin();
			myPlansPage.verifyLoaded();
			myPlansPage.openPlan(plan.reference);
			planDetailsPage.verifyLoaded();
			planDetailsPage.gateway2Link.click();
			gateway2ApplicationPage.verifyLoaded();
			gateway2ApplicationPage.openServiceNavigationItem('Sign out');
			portalLoginEmailPage.verifyLoaded();
		});
	});

	it.skip('requests a new code from the OTP page', { tags: ['notify'] }, () => {
		startPortalOtpLogin();
		portalLoginOtpPage.verifyPath();

		portalLoginOtpPage.clickRequestNewCode();

		portalLoginOtpPage.verifyNewCodeBanner();
	});
});
