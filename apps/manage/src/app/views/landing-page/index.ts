import { type IRouter, Router as createRouter } from 'express';
import { buildLandingPage } from './controller.ts';
import { asyncHandler } from '@pins/local-plans-lib/util/async-handler.ts';

export function createLandingPageRoutes(): IRouter {
	const router = createRouter({ mergeParams: true });
	const landingPage = buildLandingPage();

	router.get('/', asyncHandler(landingPage));
	return router;
}
