import { Router as createRouter } from 'express';
import { firewallErrorPage } from './controller.ts';
import type { PortalService } from '#service';
import type { IRouter } from 'express';

/**
 * Creates and configures error page routes
 *
 * Sets up routing for various error scenarios including firewall errors,
 * system errors, and other static error pages.
 *
 * @param {PortalService} service - Portal service instance for dependency injection
 * @returns {IRouter} Configured Express router with error page routes
 *
 * @example
 * ```typescript
 * const errorRoutes = createErrorRoutes(service);
 * app.use('/error', errorRoutes);
 * ```
 */
export function createErrorRoutes(service: PortalService): IRouter {
	const router = createRouter({ mergeParams: true });

	// Initialize error page handlers
	const firewallError = firewallErrorPage(service);

	// Register error page routes
	router.get('/firewall-error', firewallError);

	return router;
}
