import type { Handler } from 'express';
import { APP_CONSTANTS, UI_CONSTANTS } from '../app/constants.ts';

// Adds configuration values to template locals
class LocalsConfigurationMiddleware {
	static create(): Handler {
		return (req, res, next) => {
			// Add configuration object to template locals
			res.locals.config = {
				styleFile: 'style-9ac0aae2.css',
				cspNonce: res.locals.cspNonce,
				headerTitle: APP_CONSTANTS.APP_NAME,
				footerLinks: UI_CONSTANTS.FOOTER_LINKS,
				primaryNavigationLinks: this.buildNavigationLinks(req.path)
			};
			next();
		};
	}

	// Marks current page in navigation
	private static buildNavigationLinks(currentPath: string) {
		return UI_CONSTANTS.NAVIGATION.map((link) => ({
			...link,
			current: link.href === currentPath
		}));
	}
}

export function addLocalsConfiguration(): Handler {
	return LocalsConfigurationMiddleware.create();
}
