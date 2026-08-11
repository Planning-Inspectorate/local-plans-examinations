import { type IRouter, Router as createRouter } from 'express';
import { buildAssignedToMe } from './controller.ts';
import { asyncHandler } from '@pins/local-plans-lib/util/async-handler.ts';
import type { ManageService } from '#service';

export function createAssignedToMeRoutes(service: ManageService): IRouter {
	const router = createRouter({ mergeParams: true });
	const landingPage = buildAssignedToMe(service);

	router.get('/', asyncHandler(landingPage));

	return router;
}
