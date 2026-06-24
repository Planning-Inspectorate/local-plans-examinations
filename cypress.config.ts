import { defineConfig } from 'cypress';
import { loadEnvFile } from 'node:process';
import { plugin as cypressGrepPlugin } from '@cypress/grep/plugin';
import { exec } from 'node:child_process';

// prettier-ignore
try { loadEnvFile(); } catch {/* ignore errors*/}

const target = process.env.TEST_TARGET || 'portal';
const baseUrls: Record<string, string> = {
	manage: process.env.MANAGE_BASE_URL || 'http://localhost:8090',
	portal: process.env.PORTAL_BASE_URL || 'http://localhost:8080'
};
const specPatterns: Record<string, string> = {
	manage: 'cypress/e2e/manage/**/*',
	portal: 'cypress/e2e/portal/**/*'
};

const baseUrl = baseUrls[target];
const specPattern = specPatterns[target];

if (!baseUrl || !specPattern) {
	throw new Error(`Unsupported TEST_TARGET "${target}". Expected one of: ${Object.keys(baseUrls).join(', ')}`);
}

const runCommand = (command: string): Promise<string> =>
	new Promise((resolve, reject) => {
		exec(command, { cwd: process.cwd() }, (err, stdout, stderr) => {
			if (err) {
				console.error(stderr || err);
				reject(err);
				return;
			}
			resolve(stdout);
		});
	});

export default defineConfig({
	reporter: 'cypress-mochawesome-reporter',
	reporterOptions: {
		reportDir: 'cypress/reports',
		charts: true,
		reportPageTitle: 'Cypress Test Report',
		embeddedScreenshots: true,
		inlineAssets: true
	},

	e2e: {
		baseUrl,
		specPattern,
		screenshotsFolder: 'cypress/reports/screenshots',
		async setupNodeEvents(on, config) {
			const mochawesome = (await import('cypress-mochawesome-reporter/plugin')) as {
				default: (on: Cypress.PluginEvents) => void;
			};
			mochawesome.default(on);
			cypressGrepPlugin(config);

			on('task', {
				seedDb: async () => {
					await runCommand('node packages/database/src/seed/seed-cy.ts');
					return null;
				},
				seedCase: async () => {
					await runCommand('node --experimental-strip-types packages/database/src/seed/seed-otp.ts --case-only');
					return null;
				},
				seedOtp: async () => {
					const stdout = await runCommand('node --experimental-strip-types packages/database/src/seed/seed-otp.ts');
					const jsonLine = stdout.split('\n').find((line) => line.trim().startsWith('{'));
					const result = JSON.parse(jsonLine || '{}');
					return result.otp || null;
				},
				clearDb: async () => {
					await runCommand('node packages/database/src/seed/clear-db.ts');
					return null;
				}
			});

			return config;
		}
	},

	expose: {
		grepFilterSpecs: false,
		grepOmitFiltered: true
	}
});
