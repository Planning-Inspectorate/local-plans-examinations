import { defineConfig } from 'cypress';
import * as dotenv from 'dotenv';
import { setupNodeEvents as customTasks } from './cypress/support/tasks.ts';
import webpack from '@cypress/webpack-preprocessor';
import path from 'path';

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
		overwrite: false,
		html: false,
		json: true,
		embeddedScreenshots: true,
		inlineAssets: true
	},

	e2e: {
		baseUrl,
		screenshotsFolder: 'cypress/reports/screenshots',

		async setupNodeEvents(on, config) {
			on(
				'file:preprocessor',
				webpack({
					webpackOptions: {
						resolve: {
							alias: {
								cypress: path.resolve(__dirname, 'cypress')
							},
							extensions: ['.ts', '.js']
						},
						module: {
							rules: [
								{
									test: /\.ts$/,
									exclude: /node_modules/,
									use: [
										{
											loader: 'ts-loader',
											options: {
												transpileOnly: true // faster + avoids type-check issues in CI
											}
										}
									]
								}
							]
						}
					}
				})
			);

			const mochawesome: any = await import('cypress-mochawesome-reporter/plugin');
			mochawesome.default(on);

			customTasks(on, config);

			return config;
		}
	},

	env: {
		adminUsername: process.env.ADMIN_EMAIL,
		adminPassword: process.env.ADMIN_PASSWORD,
		grepFilterSpecs: true,
		grepOmitFiltered: true
	},

	allowCypressEnv: true
});
