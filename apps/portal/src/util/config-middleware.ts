import type { Handler } from 'express';
import { APP_CONSTANTS, UI_CONSTANTS } from '../app/constants.ts';

/**
 * Middleware class for adding configuration values to Express response locals
 *
 * Provides template variables for consistent UI rendering across all pages,
 * including navigation state, styling, and footer links.
 */
class LocalsConfigurationMiddleware {
	/**
	 * Creates Express middleware that adds configuration to res.locals
	 *
	 * @returns {Handler} Express middleware function
	 *
	 * @example
	 * ```typescript
	 * app.use(LocalsConfigurationMiddleware.create());
	 * ```
	 */
	static create(): Handler {
		return (req, res, next) => {
			// Add configuration object to template locals
			res.locals.config = {
				styleFile: UI_CONSTANTS.STYLE_FILE,
				cspNonce: res.locals.cspNonce,
				headerTitle: APP_CONSTANTS.APP_NAME,
				footerLinks: UI_CONSTANTS.FOOTER_LINKS,
				primaryNavigationLinks: this.buildNavigationLinks(req.path)
			};
			next();
		};
	}

	/**
	 * Builds navigation links with current page highlighting
	 *
	 * @param {string} currentPath - Current request path for highlighting active nav item
	 * @returns {Array} Navigation links with 'current' property set for active item
	 *
	 * @private
	 */
	private static buildNavigationLinks(currentPath: string) {
		return UI_CONSTANTS.NAVIGATION.map((link) => ({
			...link,
			current: link.href === currentPath
		}));
	}
}

/**
 * Express middleware that adds configuration values to response locals
 *
 * Makes application configuration available to all Nunjucks templates,
 * including navigation state, styling information, and footer links.
 *
 * @returns {Handler} Express middleware function
 *
 * @example
 * ```typescript
 * // In app setup
 * app.use(addLocalsConfiguration());
 *
 * // In templates
 * {{ config.headerTitle }}
 * {{ config.styleFile }}
 * ```
 */
export function addLocalsConfiguration(): Handler {
	return LocalsConfigurationMiddleware.create();
}
