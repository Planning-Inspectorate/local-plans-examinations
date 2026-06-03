import { defineConfig } from 'cypress';
import * as dotenv from 'dotenv';
import { plugin as cypressGrepPlugin } from '@cypress/grep/plugin';

dotenv.config();

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
			const mochawesome: any = await import('cypress-mochawesome-reporter/plugin');
			mochawesome.default(on);
			cypressGrepPlugin(config);

			return config;
		}
	},

	expose: {
		grepFilterSpecs: false,
		grepOmitFiltered: true
	}
});
