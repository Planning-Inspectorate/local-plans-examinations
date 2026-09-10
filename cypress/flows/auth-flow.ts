const truthyValues = ['1', 'true', 'yes'];
const microsoftLoginOrigin = 'https://login.microsoftonline.com';

const shouldUseRealAuth = () => {
	return isTruthy(Cypress.env('useRealAuth'));
};

export function skipUnlessRealEnvironmentAuth(context: Mocha.Context) {
	if (!shouldUseRealAuth()) {
		context.skip();
	}
}

const shouldRunNotifySmoke = () => {
	return isTruthy(Cypress.env('notifySmokeEnabled'));
};

export function skipUnlessNotifySmokeEnabled(context: Mocha.Context) {
	if (!shouldRunNotifySmoke()) {
		context.skip();
	}
}

export function authenticateManageIfRequired() {
	authenticateWithMicrosoftIfRequired('manage', '/auth/signin?redirect_to=/');
}

export function authenticatePortalIfRequired() {
	authenticateWithMicrosoftIfRequired('portal', '/.auth/login/aad?post_login_redirect_uri=/');
}

function authenticateWithMicrosoftIfRequired(name: 'manage' | 'portal', signInPath: string) {
	if (!shouldUseRealAuth()) {
		return;
	}

	const username = getRequiredCypressEnv('authUsername');
	const password = getRequiredCypressEnv('authPassword');

	Cypress.on('uncaught:exception', (error) => {
		if (error.message.includes('aadcdn.msauth.net') || error.message.includes('aadcdn.msftauth.net')) {
			return false;
		}
	});

	cy.session(
		[name, Cypress.config('baseUrl'), username],
		() => {
			cy.request({
				failOnStatusCode: false,
				followRedirect: false,
				url: signInPath
			}).then((response) => {
				expect(response.status).to.be.oneOf([302, 303]);
				expect(response.headers.location).to.contain('login.microsoftonline.com');
				const loginUrl = String(response.headers.location);

				cy.origin(
					microsoftLoginOrigin,
					{ args: { loginUrl, password, username } },
					({ loginUrl, password, username }) => {
						cy.visit(loginUrl);

						cy.get('input[type="email"], input[name="loginfmt"]', { timeout: 60000 })
							.should('be.visible')
							.clear()
							.type(username, { log: false });
						cy.get('input[type="submit"]').click();

						cy.get('input[type="password"]', { timeout: 60000 })
							.should('be.visible')
							.clear()
							.type(password, { log: false });
						cy.get('input[type="submit"]').click();
					}
				);
			});

			cy.location('hostname', { timeout: 60000 }).should('not.contain', 'login.microsoftonline.com');
		},
		{ cacheAcrossSpecs: true }
	);
}

function isTruthy(value: unknown) {
	return truthyValues.includes(String(value).toLowerCase());
}

export function getRequiredCypressEnv(name: string) {
	const value = Cypress.env(name);

	if (!value || String(value).startsWith('$(')) {
		throw new Error(`${name} is required`);
	}

	return String(value);
}
