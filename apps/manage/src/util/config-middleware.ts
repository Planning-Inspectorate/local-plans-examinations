import type { Handler } from 'express';

/**
 * Add configuration values to locals.
 */
export function addLocalsConfiguration(): Handler {
	return (req, res, next) => {
		res.locals.config = {
			styleFile: 'style-b6f5c667.css',
			headerTitle: 'Plans Examination back office'
		};
		next();
	};
}
