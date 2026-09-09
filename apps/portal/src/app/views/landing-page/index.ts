import { Router as createRouter } from 'express';
import { buildLandingPage } from './controller.ts';
import { asyncHandler } from '@planning-inspectorate/core/util';
import type { PortalService } from '#service';
import type { IRouter } from 'express';

export function createLandingPageRoutes(service: PortalService): IRouter {
	const router = createRouter({ mergeParams: true });

	const landingPageController = buildLandingPage(service);
	router.get('/', asyncHandler(landingPageController));

	return router;
}
