import type { ManageService } from '#service';
import type { AsyncRequestHandler } from '@pins/local-plans-lib/util/async-handler.ts';
import { createApplicationError } from '@pins/local-plans-lib/errors/application-error.ts';

export function buildListItems(service: ManageService): AsyncRequestHandler {
	const { db, logger } = service;
	return async (req, res) => {
		logger.info('list items');

		try {
			// check the DB connection is working
			await db.$queryRaw`SELECT 1`;

			return res.render('views/items/list/view.njk', {
				pageHeading: 'Local Plans Examination Service',
				items: [
					{ task: 'Create new service', done: true },
					{ task: 'Implement a new feature', done: false },
					{ task: 'Fix a bug', done: false }
				]
			});
		} catch (error) {
			throw createApplicationError(
				logger,
				'Database connection failed',
				'This service is temporarily unavailable. Please try again later.',
				error
			);
		}
	};
}
