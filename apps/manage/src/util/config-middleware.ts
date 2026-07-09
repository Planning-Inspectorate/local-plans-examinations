import type { Handler } from 'express';

/**
 * Add configuration values to locals.
 */
export function addLocalsConfiguration(): Handler {
	return (req, res, next) => {
		res.locals.config = {
			styleFile: 'style-318b26cb.css',
			headerTitle: 'Plans Examination back office'
		};
		next();
	};
}
