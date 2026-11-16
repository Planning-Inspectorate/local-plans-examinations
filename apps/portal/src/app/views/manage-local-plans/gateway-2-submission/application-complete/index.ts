import { type IRouter, Router as createRouter } from 'express';
import { buildGetApplicationCompletePage } from './controller.ts';
import { asyncHandler } from '@planning-inspectorate/core/util';
import type { PortalService } from '#service';

export function createApplicationCompleteRoutes(service: PortalService): IRouter {
	const router = createRouter({ mergeParams: true });

	router.get('/', asyncHandler(buildGetApplicationCompletePage(service)));

	return router;
}
