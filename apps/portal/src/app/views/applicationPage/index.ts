import { Router as createRouter } from 'express';
import { buildApplicationPage } from './controller.ts';
import { asyncHandler } from '@pins/local-plans-lib/util/async-handler.ts';
import type { PortalService } from '#service';
import type { IRouter } from 'express';

export function createApplicationPageRoutes(service: PortalService): IRouter {
	const router = createRouter({ mergeParams: true });

	const applicationPageController = buildApplicationPage(service);
	router.get('/:refNum/:stage', asyncHandler(applicationPageController));

	return router;
}
