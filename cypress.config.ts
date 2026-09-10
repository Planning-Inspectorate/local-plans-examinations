import { defineConfig } from 'cypress';
import { loadEnvFile } from 'node:process';
import { plugin as cypressGrepPlugin } from '@cypress/grep/plugin';
import { exec } from 'node:child_process';
import { waitForNotifyEmailByReference } from './cypress/tasks/notify.ts';

// prettier-ignore
try { loadEnvFile(); } catch {/* ignore errors*/}

const target = process.env.TEST_TARGET || 'portal';
const baseUrls: Record<string, string> = {
	'cross-service': process.env.MANAGE_BASE_URL || 'http://localhost:8090',
	manage: process.env.MANAGE_BASE_URL || 'http://localhost:8090',
	portal: process.env.PORTAL_BASE_URL || 'http://localhost:8080'
};
const specPatterns: Record<string, string> = {
	'cross-service': 'cypress/e2e/cross-service/**/*',
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

const validateCaseReference = (reference: unknown) => {
	if (typeof reference !== 'string' || !/^PLAN-\d+$/.test(reference)) {
		throw new Error('Expected a case reference like PLAN-123456');
	}

	return reference;
};

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
		env: {
			authPassword: process.env.CYPRESS_AUTH_PASSWORD,
			authUserId: process.env.CYPRESS_AUTH_USER_ID,
			authUsername: process.env.CYPRESS_AUTH_USERNAME,
			manageBaseUrl: baseUrls.manage,
			notifySmokeEmail: process.env.CYPRESS_NOTIFY_SMOKE_EMAIL || process.env.E2E_NOTIFY_EMAIL,
			notifySmokeEnabled: process.env.CYPRESS_NOTIFY_SMOKE_ENABLED === 'true',
			portalBaseUrl: baseUrls.portal,
			useRealAuth: process.env.CYPRESS_USE_REAL_AUTH === 'true'
		},
		specPattern,
		screenshotsFolder: 'cypress/reports/screenshots',
		async setupNodeEvents(on, config) {
			const mochawesome = (await import('cypress-mochawesome-reporter/plugin')) as {
				default: (on: Cypress.PluginEvents) => void;
			};
			mochawesome.default(on);
			cypressGrepPlugin(config);

			on('task', {
				log: (message: string) => {
					console.log(message);
					return null;
				},
				table: (message: unknown) => {
					console.table(message);
					return null;
				},
				seedDb: async () => {
					await runCommand('node packages/database/src/seed/seed-cy.ts');
					return null;
				},
				seedStaticData: async () => {
					await runCommand('node packages/database/src/seed/seed-prod.ts');
					return null;
				},
				seedCase: async () => {
					await runCommand('npm run db-seed');
					await runCommand('node --experimental-strip-types packages/database/src/seed/seed-otp.ts --case-only');
					return null;
				},
				seedAssignedToMeCase: async () => {
					const stdout = await runCommand('node packages/database/src/seed/seed-assigned-to-me.ts');
					const jsonLine = stdout.split('\n').find((line) => line.trim().startsWith('{'));
					if (!jsonLine) {
						throw new Error('Assigned to me seed script did not return a result');
					}
					return JSON.parse(jsonLine);
				},
				softDeleteCaseByReference: async (reference: string) => {
					const caseReference = validateCaseReference(reference);
					await runCommand(
						`SOFT_DELETE_CASE_REFERENCE=${caseReference} node packages/database/src/seed/soft-delete-case.ts`
					);
					return null;
				},
				waitForNotifyEmailByReference,
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
