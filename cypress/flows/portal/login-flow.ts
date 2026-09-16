import { portalLoginEmailPage } from '../../page-objects/portal/login/email-page.ts';
import { portalLoginOtpPage } from '../../page-objects/portal/login/otp-page.ts';
import { myPlansPage } from '../../page-objects/portal/my-plans-page.ts';
import { authenticatePortalIfRequired, getRequiredCypressEnv, isEnvironmentSmoke } from '../auth-flow.ts';

export const TEST_EMAIL = 'test@planninginspectorate.gov.uk';
export const SECOND_TEST_EMAIL = 'test2@planninginspectorate.gov.uk';

const getCsrfToken = (html: string) => {
	const token = new DOMParser()
		.parseFromString(html, 'text/html')
		.querySelector<HTMLInputElement>('input[name="_csrf"]')?.value;

	if (!token) {
		throw new Error('Could not find CSRF token');
	}

	return token as string;
};

export const startPortalOtpLogin = (email = getPortalLoginEmail()) => {
	if (isEnvironmentSmoke()) {
		cy.task('seedPortalSmokeCase').then((plan) => {
			const reference = (plan as { reference?: string }).reference;

			if (reference) {
				Cypress.env('portalSmokeCaseReference', reference);
			}
		});
		authenticatePortalIfRequired();
	} else {
		cy.task('seedCase');
	}

	portalLoginEmailPage.visit();
	portalLoginEmailPage.enterEmail(email);
	portalLoginEmailPage.saveAndContinue();
};

export const completePortalLogin = () => {
	if (isEnvironmentSmoke()) {
		portalLoginOtpPage.enterOtp(getPortalSmokeOtp());
		portalLoginOtpPage.saveAndContinue();
		return;
	}

	cy.task('seedOtp').then((otp) => {
		portalLoginOtpPage.enterOtp(String(otp));
		portalLoginOtpPage.saveAndContinue();
	});
};

export const portalLogin = () => {
	if (isEnvironmentSmoke()) {
		authenticatePortalIfRequired();
		completePortalLoginByRequest();
		myPlansPage.visit();
		return;
	}

	cy.setCookie('cookie_consent', 'accept');
	startPortalOtpLogin();
	completePortalLogin();
};

const getPortalLoginEmail = () => {
	if (isEnvironmentSmoke()) {
		return getRequiredCypressEnv('authUsername');
	}

	return TEST_EMAIL;
};

const getPortalSmokeOtp = () => getRequiredCypressEnv('portalSmokeOtp');

const completePortalLoginByRequest = () => {
	const email = getRequiredCypressEnv('authUsername');
	const otp = getPortalSmokeOtp();
	const baseUrl = String(Cypress.config('baseUrl'));
	const loginUrl = `${baseUrl}/login`;
	const otpUrl = `${baseUrl}/login/enter-code`;

	cy.setCookie('cookie_consent', 'accept');
	cy.request({ failOnStatusCode: false, url: '/login' }).then((response) => {
		expect(response.status).to.eq(200);
		const csrfToken = getCsrfToken(response.body);

		cy.request({
			body: { _csrf: csrfToken, email },
			failOnStatusCode: false,
			followRedirect: false,
			form: true,
			headers: {
				origin: baseUrl,
				referer: loginUrl
			},
			method: 'POST',
			url: '/login'
		}).then((response) => {
			expect(response.status).to.eq(302);
			expect(response.headers.location).to.contain('/login/enter-code');
		});
	});
	cy.request({ failOnStatusCode: false, url: '/login/enter-code' })
		.then((response) => {
			expect(response.status).to.eq(200);
			const csrfToken = getCsrfToken(response.body);

			cy.request({
				body: { _csrf: csrfToken, otp },
				failOnStatusCode: false,
				followRedirect: false,
				form: true,
				headers: {
					origin: baseUrl,
					referer: otpUrl
				},
				method: 'POST',
				url: '/login/enter-code'
			});
		})
		.then((response) => {
			expect(response.status).to.eq(302);
			expect(response.headers.location).to.contain('/manage-local-plans/your-plans');
		});
};

export const manageToPortalLogin = () => {
	cy.origin(Cypress.env('portalBaseUrl'), { args: { email: TEST_EMAIL } }, ({ email }) => {
		cy.visit('/login');
		cy.setCookie('cookie_consent', 'accept');
		cy.get('[data-cy="email"]').clear().type(email);
		cy.get('[data-cy="button-save-and-continue"]').click();
	});

	cy.task('seedOtp').then((otp) => {
		cy.origin(Cypress.env('portalBaseUrl'), { args: { otp: String(otp) } }, ({ otp }) => {
			cy.get('[data-cy="otp"]').clear().type(otp);
			cy.get('[data-cy="button-save-and-continue"]').click();
		});
	});
};
