import { createRequire } from 'node:module';
import path from 'node:path';
import nunjucks from 'nunjucks';
import { loadBuildConfig } from './config.ts';

/**
 * Configures Nunjucks templating engine with required template paths
 *
 * Sets up Nunjucks with access to:
 * - GOV.UK Frontend components
 * - Dynamic Forms templates
 * - Application-specific templates
 *
 * @returns {nunjucks.Environment} Configured Nunjucks environment ready for rendering
 *
 * @example
 * ```typescript
 * const nunjucks = configureNunjucks();
 * const html = nunjucks.render('template.njk', { data: 'value' });
 * ```
 */
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
