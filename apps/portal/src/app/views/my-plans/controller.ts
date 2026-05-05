import type { Handler } from 'express';

/**
 * GET /my-plans - Placeholder for the My Plans landing page
 */
export function getMyPlans(): Handler {
	return (_req, res) => {
		res.render('views/my-plans/view.njk', {
			pageTitle: 'My Plans'
		});
	};
}
