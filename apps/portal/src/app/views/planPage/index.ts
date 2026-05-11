import { Router as createRouter } from 'express';
import { buildPlanPage } from './controller.ts';
import { asyncHandler } from '@pins/local-plans-lib/util/async-handler.ts';
import type { PortalService } from '#service';
import type { Request, Response } from 'express';

export function createPlanPageRoutes(service: PortalService) {
	const router = createRouter({ mergeParams: true });
	const controller = buildPlanPage(service);

	router.get('/planPage/:refNum', asyncHandler(controller));

	router.post(
		'/planPage',
		asyncHandler(async (req: Request, res: Response) => {
			const data = req.body;
			console.log(data);
			res.redirect('/success');
		})
	);

	return router;
}
