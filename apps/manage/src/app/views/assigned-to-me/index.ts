import { type IRouter, Router as createRouter } from 'express';
import { buildAssignedToMe } from './controller.ts';
import { asyncHandler } from '@planning-inspectorate/core/util';
import type { ManageService } from '#service';

export function createAssignedToMeRoutes(service: ManageService): IRouter {
	const router = createRouter({ mergeParams: true });
	const landingPage = buildAssignedToMe(service);

	router.get('/', asyncHandler(landingPage));

	return router;
}
