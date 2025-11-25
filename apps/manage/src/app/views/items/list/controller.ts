import type { ManageService } from '#service';
import type { AsyncRequestHandler } from '@pins/local-plans-lib/util/async-handler.ts';
import { QuestionnaireService, QuestionnaireDataService } from '../../questionnaire/service.ts';

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
