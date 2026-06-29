import type { Request, Response } from 'express';
import type { AsyncRequestHandler } from '@pins/local-plans-lib/util/async-handler.ts';
import type { ManageService } from '#service';

export function buildYourPlansPage(service: ManageService): AsyncRequestHandler {
	return async (req: Request, res: Response) => {
		const { db, logger } = service;

		try {
			const cases = await db.case.findMany({
				orderBy: { createdAt: 'desc' }
			});

			return res.render('views/your-plans/your-plans.njk', {
				pageTitle: 'Your plans',
				pageHeading: 'Your plans',
				cases
			});
		} catch (error) {
			logger.error(`Unable to fetch cases ${error}`);
			return res.status(500).render('views/errors/500.njk');
		}
	};
}
