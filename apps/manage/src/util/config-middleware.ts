import type { Handler } from 'express';

/**
 * Add configuration values to locals.
 */
export function addLocalsConfiguration(): Handler {
	return (req, res, next) => {
		res.locals.config = {
			styleFile: 'style-ddef3dad.css',
			headerTitle: 'Plans Examination back office'
		};
		next();
	};
}
