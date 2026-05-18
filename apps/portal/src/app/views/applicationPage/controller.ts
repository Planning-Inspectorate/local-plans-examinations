import type { PortalService } from '#service';
import type { AsyncRequestHandler } from '@pins/local-plans-lib/util/async-handler.ts';

/**
 * Example home page controller
 */
export function buildApplicationPage(service: PortalService): AsyncRequestHandler {
	const { db, logger } = service;
	return async (req, res) => {
		let connected = false;
		try {
			// Check if the database is connected
			await db.$queryRaw`SELECT 1`;
			connected = true;
		} catch (error) {
			logger.error({ error }, 'Database connection failed');
		}

		req.session.visits = (req.session.visits || 0) + 1;

		const viewModel = {
			connected,
			visitCount: req.session.visits
		};

		logger.info({ viewModel }, 'application page');
		return res.render('views/applicationPage/view.njk', {
			pageTitle: 'This is the home page',
			...viewModel
		});
	};
}
