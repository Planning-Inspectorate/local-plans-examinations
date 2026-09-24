import { skipUnlessEnvironmentSmoke } from '../../../../flows/auth-flow.ts';
import { submitGateway2Application } from '../../../../flows/portal/gateway-2-submission-flow.ts';
import { completePortalLogin, startPortalOtpLogin } from '../../../../flows/portal/login-flow.ts';
import { cleanupPreparedPlanDetails } from '../../../../flows/portal/plan-flow.ts';
import { gateway2CoverLetterPage } from '../../../../page-objects/portal/gw2-application/gateway-2-uploads.page.ts';
import { myPlansPage } from '../../../../page-objects/portal/my-plans-page.ts';

describe('Portal Notify smoke', () => {
	before(function () {
		skipUnlessEnvironmentSmoke(this);
	});

	afterEach(cleanupPreparedPlanDetails);

	it('logs in and submits a Gateway 2 application', { tags: ['environment-smoke'] }, () => {
		startPortalOtpLogin();
		completePortalLogin();
		myPlansPage.verifyLoaded();

		cy.then(() => {
			const reference = String(Cypress.env('portalSmokeCaseReference'));

			submitGateway2Application({ reference }, [{ page: gateway2CoverLetterPage, fileNames: ['test-document.pdf'] }]);

			/* Notify API verification is temporarily disabled while the Test service has an unreliable daily send quota.
			const expectedReferences = [`portal-login:${reference}`, `gateway-2-submission:${reference}`];
			cy.task<Array<{ id?: string; reference?: string }>>(
				'waitForNotifyEmailsByReference',
				{
					notifications: expectedReferences.map((notifyReference) => ({ reference: notifyReference }))
				},
				{ timeout: 750000 }
			).then((notifications) => {
				expect(notifications.map(({ reference: notifyReference }) => notifyReference)).to.deep.equal(
					expectedReferences
				);
				notifications.forEach(({ id }) => expect(id).to.match(/\S+/));
			});
			*/
		});
	});
});
