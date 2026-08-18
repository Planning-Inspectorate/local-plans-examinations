import { portalLogin, startPortalOtpLogin } from '../../../flows/portal/login-flow.ts';
import type { PlanDetailsFixture } from '../../../fixtures/portal/types.ts';
import { applicationCompletePage } from '../../../page-objects/portal/gw2-application/application-complete-page.ts';
import { portalDeclarationPage } from '../../../page-objects/portal/gw2-application/declaration-page.ts';
import { gateway2ApplicationPage } from '../../../page-objects/portal/gw2-application/gateway-2-application-page.ts';
import { portalLandingPage } from '../../../page-objects/portal/landing-page.ts';
import { portalLoginEmailPage } from '../../../page-objects/portal/login/email-page.ts';
import { portalLoginOtpPage } from '../../../page-objects/portal/login/otp-page.ts';
import { planDetailsPage } from '../../../page-objects/portal/plan-details/plan-details-page.ts';
import { ERROR_MESSAGES } from 'cypress/constants/portal/error-messages.ts';

const loadPlanDetails = () => cy.fixture<PlanDetailsFixture>('portal/plan-details.json');

describe('Portal accessibility', () => {
	beforeEach(() => {
		cy.task('clearDb');
	});

	after(() => cy.task('clearDb'));

	it('checks the login page', { tags: ['accessibility'] }, () => {
		portalLoginEmailPage.visit();
		portalLoginEmailPage.verifyHeading('Sign-in');

		cy.checkAccessibility();
	});

	it('checks the one-time password page', { tags: ['accessibility'] }, () => {
		startPortalOtpLogin();
		portalLoginOtpPage.verifyLoaded();
		portalLoginOtpPage.verifyHeading('Enter your one-time password');

		cy.checkAccessibility();
	});

	it('checks the Your plans page', { tags: ['accessibility'] }, () => {
		portalLogin();
		portalLandingPage.verifyLoaded();

		cy.checkAccessibility();
	});

	it('checks the plan details page', { tags: ['accessibility'] }, () => {
		portalLogin();

		loadPlanDetails().then((plan) => {
			portalLandingPage.openPlan(plan.reference);
			planDetailsPage.verifyLoaded();
			planDetailsPage.verifyHeading(plan.title);

			cy.checkAccessibility();
		});
	});

	it('checks the Gateway 2 submission validation error state', { tags: ['accessibility'] }, () => {
		portalLogin();

		loadPlanDetails().then((plan) => {
			gateway2ApplicationPage.visit(plan.urlReference);
			gateway2ApplicationPage.verifyLoaded();
			gateway2ApplicationPage.submitGateway2AssessmentButton.click();
			gateway2ApplicationPage.verifyErrorSummary(ERROR_MESSAGES.THERE_IS_A_PROBLEM, ERROR_MESSAGES.ADD_ONE_DOCUMENT);

			cy.checkAccessibility();
		});
	});

	it('checks the declaration page', { tags: ['accessibility'] }, () => {
		portalLogin();

		loadPlanDetails().then((plan) => {
			portalDeclarationPage.visit(plan.urlReference);
			portalDeclarationPage.verifyLoaded();

			cy.checkAccessibility();
		});
	});

	it('checks the application complete page', { tags: ['accessibility'] }, () => {
		portalLogin();

		loadPlanDetails().then((plan) => {
			applicationCompletePage.visit(plan.urlReference);
			applicationCompletePage.verifyLoaded();

			cy.checkAccessibility();
		});
	});
});
