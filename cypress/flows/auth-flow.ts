const microsoftLoginOrigin = 'https://login.microsoftonline.com';

export function skipUnlessEnvironmentSmoke(context: Mocha.Context) {
	if (!isEnvironmentSmoke()) {
		context.skip();
	}
}

export function isEnvironmentSmoke() {
	return Boolean(Cypress.env('environmentSmoke'));
}

export function authenticateManageIfRequired() {
	authenticateWithMicrosoftIfRequired('manage', '/auth/signin?redirect_to=/');
}

export function authenticatePortalIfRequired() {
	authenticateWithMicrosoftIfRequired('portal', '/.auth/login/aad?post_login_redirect_uri=/');
}

function authenticateWithMicrosoftIfRequired(name: 'manage' | 'portal', signInPath: string) {
	if (!isEnvironmentSmoke()) {
		return;
	}

	const username = getRequiredCypressEnv('authUsername');
	const password = getRequiredCypressEnv('authPassword');
	const applicationOrigin = new URL(String(Cypress.config('baseUrl'))).origin;

	cy.session(
		[name, Cypress.config('baseUrl'), username],
		() => {
			cy.request({
				failOnStatusCode: false,
				followRedirect: false,
				url: signInPath
			}).then((response) => {
				expect(response.status).to.be.oneOf([302, 303]);
				expect(new URL(String(response.headers.location)).hostname).to.eq('login.microsoftonline.com');
				const loginUrl = String(response.headers.location);

				completeMicrosoftLogin(username, password, loginUrl);
			});

			cy.location('origin', { timeout: 60000 }).should('eq', applicationOrigin);
		},
		{
			cacheAcrossSpecs: true
		}
	);
}

function completeMicrosoftLogin(username: string, password: string, loginUrl: string) {
	cy.origin(microsoftLoginOrigin, { args: { loginUrl, password, username } }, ({ loginUrl, password, username }) => {
		Cypress.on('uncaught:exception', (error) => {
			const allowedHosts = new Set(['aadcdn.msauth.net', 'aadcdn.msftauth.net']);
			const urls = error.message.match(/https?:\/\/[^\s)"']+/g) ?? [];
			const isMicrosoftCdnError = urls.some((url) => {
				try {
					return allowedHosts.has(new URL(url).hostname);
				} catch {
					return false;
				}
			});

			if (isMicrosoftCdnError) {
				return false;
			}
		});

		if (loginUrl) {
			cy.visit(loginUrl);
		}

		cy.get('input[type="email"], input[name="loginfmt"]', { timeout: 60000 })
			.should('be.visible')
			.clear()
			.type(username, { log: false });
		cy.get('input[type="submit"]').click();

		cy.get('input[type="password"]', { timeout: 60000 }).should('be.visible').clear().type(password, { log: false });
		cy.get('input[type="submit"]').click();
	});
}

export function getRequiredCypressEnv(name: string) {
	const value = Cypress.env(name);

	if (!value || String(value).startsWith('$(')) {
		throw new Error(`${name} is required`);
	}

	return String(value);
}
