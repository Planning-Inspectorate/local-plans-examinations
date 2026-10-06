import { getRequiredCypressEnv, skipUnlessEnvironmentSmoke } from '../../../../flows/auth-flow.ts';
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

	it('sends login and Gateway 2 submission emails through Notify', { tags: ['environment-smoke'] }, () => {
		const email = createUniqueSmokeEmail();
		cy.task<{ reference: string }>('seedPortalSmokeCase', { email }).then(({ reference }) => {
			Cypress.env('portalSmokeCaseReference', reference);
		});
		startPortalOtpLogin(email, { seedCase: false });
		completePortalLogin();
		myPlansPage.verifyLoaded();

		cy.then(() => {
			const reference = String(Cypress.env('portalSmokeCaseReference'));

			submitGateway2Application({ reference }, [{ page: gateway2CoverLetterPage, fileNames: ['test-document.pdf'] }]);

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
		});
	});
});

const createUniqueSmokeEmail = () => {
	const [localPart, domain] = getRequiredCypressEnv('authUsername').split('@');
	return `${localPart}+portal-notify-${Date.now()}@${domain}`;
};
