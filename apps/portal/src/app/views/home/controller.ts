import type { AsyncRequestHandler } from '@planning-inspectorate/core/util';

export function buildGuidancePage(): AsyncRequestHandler {
	return async (req, res) => {
		return res.render('views/home/guidance.njk', {
			pageTitle: 'Guidance page'
		});
	};
}
