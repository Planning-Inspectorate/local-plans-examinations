import type { Response, Request } from 'express';
import type { AsyncRequestHandler } from '@pins/local-plans-lib/util/async-handler.ts';
import { ManageService } from '#service';

export function buildLandingPage(service: ManageService): AsyncRequestHandler {
	return async (req: Request, res: Response) => {
		const { db, logger } = service;
		try {
			const cases = await db.case.findMany();
			return res.render('views/landing-page/landing-page.njk', { cases });
		} catch (error) {
			logger.error(`Unable to fetch cases ${error}`);
			return res.status(500).render('views/errors/500.njk', { error });
		}
	};
}
