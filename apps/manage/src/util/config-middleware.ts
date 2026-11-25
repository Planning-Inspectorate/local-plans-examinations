import type { Handler } from 'express';

/**
 * Add configuration values to locals.
 */
export function addLocalsConfiguration(clarityId?: string, googleAnalyticsId?: string): Handler {
	return (req, res, next) => {
		res.locals.config = {
			styleFile: 'style-b3f1185f.css',
			headerTitle: 'Plans Examination back office',
			clarityId,
			googleAnalyticsId
		};
		next();
	};
}
