import { type IRouter, Router as createRouter } from 'express';
import { buildLandingPage } from './controller.ts';
import { asyncHandler } from '@pins/local-plans-lib/util/async-handler.ts';
import type { ManageService } from '#service';

export function createLandingPageRoutes(service: ManageService): IRouter {
	const router = createRouter({ mergeParams: true });
	const landingPage = buildLandingPage(service);

	router.get('/', asyncHandler(landingPage));
	return router;
}
