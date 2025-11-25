import type { ManageService } from '#service';
import type { AsyncRequestHandler } from '@pins/local-plans-lib/util/async-handler.ts';
import { QuestionnaireService, QuestionnaireDataService } from '../../questionnaire/service.ts';

/**
 * Builds items list controller for manage app dashboard
 *
 * Creates controller that displays the main management dashboard with task items
 * and questionnaire statistics. Tests database connectivity and renders overview.
 *
 * @param {ManageService} service - Manage app service containing database and logger
 * @returns {AsyncRequestHandler} Express request handler for items list dashboard
 */
export function buildListItems(service: ManageService): AsyncRequestHandler {
	const { db, logger } = service;
	return async (req, res) => {
		logger.info('list items');

		// check the DB connection is working
		await db.$queryRaw`SELECT 1`;

		// Get questionnaire count
		const questionnaireDataService = new QuestionnaireDataService(db, logger);
		const questionnaireService = new QuestionnaireService(logger, questionnaireDataService);
		const questionnaireCount = await questionnaireService.getTotalSubmissions();

		return res.render('views/items/list/view.njk', {
			pageHeading: 'Local Plans Management',
			questionnaireCount,
			items: [
				{ task: 'Create new service', done: true },
				{ task: 'Implement a new feature', done: false },
				{ task: 'Fix a bug', done: false }
			]
		});
	};
}
