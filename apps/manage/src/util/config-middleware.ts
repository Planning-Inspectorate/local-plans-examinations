import type { Handler } from 'express';

/**
 * Add configuration values to locals.
 */
export function addLocalsConfiguration(): Handler {
	return (req, res, next) => {
		res.locals.config = {
			styleFile: 'style-d23f9c72.css',
			headerTitle: 'Plans Examination back office'
		};
		next();
	};
}
