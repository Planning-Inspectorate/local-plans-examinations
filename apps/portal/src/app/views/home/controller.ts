import type { PortalService } from '#service';
import type { AsyncRequestHandler } from '@pins/local-plans-examinations-lib/util/async-handler.ts';

/**
 * Example home page controller
 */
export function buildHomePage(service: PortalService): AsyncRequestHandler {
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

		let questionnaireCount = 0;
		try {
			const questionnaire = await service.helloWorldService.getQuestionnaire();
			if (questionnaire) questionnaireCount = 1;
		} catch (error) {
			logger.error({ error }, 'Failed to fetch questionnaire count');
		}

		const viewModel = {
			connected,
			visitCount: req.session.visits,
			questionnaireCount
		};

		logger.info({ viewModel }, 'home page');
		return res.render('views/home/view.njk', {
			pageTitle: 'This is the home page',
			...viewModel
		});
	};
}
