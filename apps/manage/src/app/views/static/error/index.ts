import { Router as createRouter } from 'express';
import { firewallErrorPage } from './controller.ts';
import type { ManageService } from '#service';
import type { IRouter } from 'express';

/**
 * Creates static error routes for manage app
 *
 * Sets up routing for static error pages including firewall errors.
 * Provides centralized error page handling for blocked requests.
 *
 * @param {ManageService} service - Manage app service for dependency injection
 * @returns {IRouter} Express router configured with error routes
 */
export function createErrorRoutes(service: ManageService): IRouter {
	const router = createRouter({ mergeParams: true });

	const firewallError = firewallErrorPage(service);

	router.get('/firewall-error', firewallError);

	return router;
}
