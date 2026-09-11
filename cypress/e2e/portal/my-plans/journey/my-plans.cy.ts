import { myPlansPage } from '../../../../page-objects/portal/my-plans-page.ts';
import {
	portalLogin,
	startPortalOtpLogin,
	completePortalLogin,
	SECOND_TEST_EMAIL
} from '../../../../flows/portal/login-flow.ts';

describe('My plans journey', () => {
	beforeEach(() => cy.task('clearDb'));

	after(() => cy.task('clearDb'));

	it('shows multiple plans for the same user in the correct order', { tags: ['regression'] }, () => {
		portalLogin();
		myPlansPage.verifyLoaded();
		myPlansPage.verifyPlanOrder(['PLAN-001', 'PLAN-002']);
	});

	it('does not plans for user with a different email address', { tags: ['regression'] }, () => {
		cy.setCookie('cookie_consent', 'accept');
		startPortalOtpLogin(SECOND_TEST_EMAIL);
		completePortalLogin();

		myPlansPage.verifyLoaded();
		myPlansPage.verifyPlanListed('PLAN-B01');
		myPlansPage.verifyPlanNotListed('PLAN-001');
		myPlansPage.verifyPlanNotListed('PLAN-002');
	});
});
