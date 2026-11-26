import { myPlansPage } from '../../../../page-objects/portal/my-plans-page.ts';
import {
	portalLogin,
	startPortalOtpLogin,
	completePortalLogin,
	SECOND_TEST_EMAIL,
	FIXTURE_TEST_EMAIL
} from '../../../../flows/portal/login-flow.ts';
import { openGateway2ApplicationPage } from '../../../../flows/portal/plan-flow.ts';

describe('My plans journey', () => {
	beforeEach(() => cy.task('clearDb'));

	after(() => cy.task('clearDb'));

	it('shows multiple plans for the same user in the correct order', { tags: ['regression'] }, () => {
		portalLogin();
		myPlansPage.verifyLoaded();
		myPlansPage.verifyPlanOrder(['PLAN-001', 'PLAN-002']);
	});

	it('lets a case contact sign in and open their Gateway 2 submission', { tags: ['regression'] }, () => {
		cy.task<{ reference: string }>('seedDb', { examination: {} }).then(({ reference }) => {
			portalLogin(FIXTURE_TEST_EMAIL);
			openGateway2ApplicationPage(reference);
		});
	});

	it('does not show plans for user with a different email address', { tags: ['regression'] }, () => {
		cy.setCookie('cookie_consent', 'accept');
		startPortalOtpLogin(SECOND_TEST_EMAIL);
		completePortalLogin();

		myPlansPage.verifyLoaded();
		myPlansPage.verifyPlanListed('PLAN-B01');
		myPlansPage.verifyPlanNotListed('PLAN-001');
		myPlansPage.verifyPlanNotListed('PLAN-002');
	});
});
