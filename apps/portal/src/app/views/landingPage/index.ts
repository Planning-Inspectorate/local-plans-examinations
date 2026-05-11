import { Router as createRouter } from 'express';
import { buildLandingPage } from './controller.ts';
import { asyncHandler } from '@pins/local-plans-lib/util/async-handler.ts';
import type { PortalService } from '#service';
import type { Request, Response } from 'express';

export function createLandingPageRoutes(service: PortalService) {
	const router = createRouter({ mergeParams: true });
	const controller = buildLandingPage(service);

	router.get('/landingPage', asyncHandler(controller));

	router.post(
		'/landingPage',
		asyncHandler(async (req: Request, res: Response) => {
			const data = req.body;

			console.log(data);

			if (!data.fullName) {
				return res.status(400).send('Full name required');
			}

			res.redirect('/success');
		})
	);

	return router;
}
