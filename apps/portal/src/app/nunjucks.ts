import { createRequire } from 'node:module';
import path from 'node:path';
import nunjucks from 'nunjucks';
import { loadBuildConfig } from './config.ts';

// Configures Nunjucks with GOV.UK Frontend, Dynamic Forms, and app templates
export function configureNunjucks(): nunjucks.Environment {
	const config = loadBuildConfig();

	// Create require function for resolving node_modules paths in ES modules
	const require = createRequire(import.meta.url);
	// Resolve GOV.UK Frontend template directory
	const govukFrontendRoot = path.resolve(require.resolve('govuk-frontend'), '../..');
	// Resolve Dynamic Forms template directory
	const dynamicFormsRoot = path.resolve(require.resolve('@planning-inspectorate/dynamic-forms'), '..');
	// Application template directory
	const appDir = path.join(config.srcDir, 'app');

	// Configure Nunjucks with all required template search paths
	return nunjucks.configure(
		// Template search order: GOV.UK Frontend, Dynamic Forms, Application templates
		[govukFrontendRoot, dynamicFormsRoot, appDir],
		{
			// output with dangerous characters are escaped automatically
			autoescape: true,
			// automatically remove trailing newlines from a block/tag
			trimBlocks: true,
			// automatically remove leading whitespace from a block/tag
			lstripBlocks: true
		}
	);
}
