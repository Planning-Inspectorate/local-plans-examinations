import { Router as createRouter } from 'express';
import { asyncHandler } from '@pins/local-plans-lib/util/async-handler.ts';
import { buildListItems } from './list/controller.ts';
import type { ManageService } from '#service';
import type { IRouter } from 'express';

/**
 * Creates items router for manage app
 *
 * Sets up routing for items management functionality including the main dashboard.
 * Configures routes with proper async error handling.
 *
 * @param {ManageService} service - Manage app service for dependency injection
 * @returns {IRouter} Express router configured with items routes
 */
export function createRoutes(service: ManageService): IRouter {
	const router = createRouter({ mergeParams: true });
	const listItems = buildListItems(service);

	router.get('/', asyncHandler(listItems));

	return router;
}
