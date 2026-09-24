import { defineConfig } from 'cypress';
import { loadEnvFile } from 'node:process';
import { plugin as cypressGrepPlugin } from '@cypress/grep/plugin';
import { exec } from 'node:child_process';
import { waitForNotifyEmailByReference, waitForNotifyEmailsByReference } from './cypress/tasks/notify.ts';
import { seedCy } from './packages/database/src/seed/seed-cy.ts';

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
const environmentSmoke = process.env.ENVIRONMENT_SMOKE === 'true';

if (!baseUrl || !specPattern) {
	throw new Error(`Unsupported TEST_TARGET "${target}". Expected one of: ${Object.keys(baseUrls).join(', ')}`);
}

const runCommand = (command: string, env: NodeJS.ProcessEnv = {}): Promise<string> =>
	new Promise((resolve, reject) => {
		exec(command, { cwd: process.cwd(), env: { ...process.env, ...env } }, (err, stdout, stderr) => {
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
			environmentSmoke,
			manageBaseUrl: baseUrls.manage,
			notifySmokeEmail: process.env.CYPRESS_NOTIFY_SMOKE_EMAIL,
			portalBaseUrl: baseUrls.portal,
			portalSmokeOtp: process.env.CYPRESS_PORTAL_SMOKE_OTP
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
				seedDb: seedCy,
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
				seedPortalSmokeCase: async () => {
					const stdout = await runCommand('node packages/database/src/seed/seed-portal-smoke.ts');
					const jsonLine = stdout.split('\n').find((line) => line.trim().startsWith('{'));
					if (!jsonLine) {
						throw new Error('Portal smoke seed script did not return a result');
					}
					return JSON.parse(jsonLine);
				},
				softDeleteCaseByReference: async (reference: string) => {
					const caseReference = validateCaseReference(reference);
					await runCommand('node packages/database/src/seed/soft-delete-case.ts', {
						SOFT_DELETE_CASE_REFERENCE: caseReference
					});
					return null;
				},
				waitForNotifyEmailByReference,
				waitForNotifyEmailsByReference,
				seedOtp: async () => {
					const stdout = await runCommand('node --experimental-strip-types packages/database/src/seed/seed-otp.ts');
					const jsonLine = stdout.split('\n').find((line) => line.trim().startsWith('{'));
					const result = JSON.parse(jsonLine || '{}');
					return result.otp || null;
				},
				clearDb: async () => {
					if (environmentSmoke) {
						return null;
					}

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
