import { createRequire } from 'node:module';
import path from 'node:path';
import nunjucks from 'nunjucks';
import { loadBuildConfig } from './config.ts';

/**
 * Configure nunjucks with govuk and app folders for loading views
 */
export function configureNunjucks(): nunjucks.Environment {
	const config = loadBuildConfig();

	// get the require function, see https://nodejs.org/api/module.html#modulecreaterequirefilename
	const require = createRequire(import.meta.url);
	// Resolve Dynamic Forms template directory
	const dynamicFormsRoot = path.resolve(require.resolve('@planning-inspectorate/dynamic-forms'), '..');
	// get the path to the govuk-frontend folder, in node_modules, using the node require resolution
	const govukFrontendRoot = path.resolve(require.resolve('govuk-frontend'), '../..');
	const appDir = path.join(config.srcDir, 'app');

	// configure nunjucks
	const env = nunjucks.configure(
		// ensure nunjucks templates can use govuk-frontend components, and templates we've defined in `web/src/app`
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

	// Add date filter
	env.addFilter('date', (date: Date | string, format: string) => {
		const d = new Date(date);
		if (format === 'd MMMM yyyy, HH:mm') {
			return d.toLocaleDateString('en-GB', {
				day: 'numeric',
				month: 'long',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit',
				hour12: false
			});
		}
		if (format === 'd MM yy') {
			return d.toLocaleDateString('en-GB', {
				day: '2-digit',
				month: 'short',
				year: '2-digit'
			});
		}
		return d.toISOString();
	});

	return env;
}
