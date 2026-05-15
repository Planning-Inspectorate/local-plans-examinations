import { Router as createRouter } from 'express';
import { buildPlanPage } from './controller.ts';
import { asyncHandler } from '@pins/local-plans-lib/util/async-handler.ts';
import type { PortalService } from '#service';
import type { IRouter } from 'express';

export function createPlanPageRoutes(service: PortalService): IRouter {
	const router = createRouter({ mergeParams: true });

	const planPageController = buildPlanPage(service);
	router.get('/:refNum', asyncHandler(planPageController));

	return router;
}
