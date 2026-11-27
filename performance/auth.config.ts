import { defineConfig } from 'cypress';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { settings } from './scripts/settings.ts';

const performance = settings();
const sessions = new Set<string>();

export default defineConfig({
	reporter: 'spec',
	video: false,
	screenshotOnRunFailure: false,
	e2e: {
		baseUrl: performance.manageUrl,
		specPattern: 'performance/prepare-auth.cy.ts',
		supportFile: 'cypress/support/commands.ts',
		env: {
			environmentSmoke: process.env.PERFORMANCE_LOCAL !== 'true',
			authUsername: process.env.CYPRESS_AUTH_USERNAME,
			authPassword: process.env.CYPRESS_AUTH_PASSWORD
		},
		setupNodeEvents(on, config) {
			config.env.manageReferences = JSON.parse(readFileSync(join(performance.privateDir, 'references.json'), 'utf8'));
			on('task', {
				savePerformanceCookies({ index, cookies }: { index: number; cookies: Cypress.Cookie[] }) {
					const session = cookies.find(({ name }) => name === 'manage');
					if (!session) throw new Error('Manage session cookie missing');
					if (sessions.has(session.value)) throw new Error('Performance users must have independent sessions');
					sessions.add(session.value);
					// JMeter cookie-file format
					const jar = cookies
						.map((cookie) =>
							[
								cookie.domain,
								cookie.hostOnly ? 'FALSE' : 'TRUE',
								cookie.path,
								String(cookie.secure).toUpperCase(),
								Math.floor(cookie.expiry || 0),
								cookie.name,
								cookie.value
							].join('\t')
						)
						.join('\n');
					writeFileSync(join(performance.privateDir, `manage-${index + 1}.cookies`), jar + '\n', { mode: 0o600 });
					return null;
				}
			});
			return config;
		}
	}
});
