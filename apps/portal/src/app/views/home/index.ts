import { Router as createRouter } from 'express';
import { buildHomePage } from './controller.ts';
import { asyncHandler } from '@pins/local-plans-lib/util/async-handler.ts';
import type { PortalService } from '#service';
import type { IRouter } from 'express';

/**
 * Creates and configures routes for the home page module
 *
 * Sets up the main landing page route with database health checking
 * and visit tracking functionality.
 *
 * @param {PortalService} service - Portal service instance for dependency injection
 * @returns {IRouter} Configured Express router for home page routes
 *
 * @example
 * ```typescript
 * const homeRoutes = createHomeRoutes(service);
 * app.use('/', homeRoutes);
 * ```
 */
export function createHomeRoutes(service: PortalService): IRouter {
	const router = createRouter({ mergeParams: true });

	// Main home page route
	const homePageController = buildHomePage(service);
	router.get('/', asyncHandler(homePageController));

	return router;
}
