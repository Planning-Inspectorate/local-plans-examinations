import { defineConfig } from 'cypress';
import * as dotenv from 'dotenv';

dotenv.config();

const target = process.env.TEST_TARGET;
const baseUrl = target === 'manage' ? process.env.MANAGE_BASE_URL : process.env.PORTAL_BASE_URL;

if (!baseUrl) {
	throw new Error('BaseUrl is not defined. Make sure PORTAL_BASE_URL or MANAGE_BASE_URL is set in .env');
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
		screenshotsFolder: 'cypress/reports/screenshots',
		async setupNodeEvents(on, config) {
			const mochawesome: any = await import('cypress-mochawesome-reporter/plugin');
			mochawesome.default(on);

			return config;
		}
	},

	env: {
		grepFilterSpecs: true,
		grepOmitFiltered: true
	},

	allowCypressEnv: true
});
