import { buildRouter } from './router.ts';
import { configureNunjucks } from './nunjucks.ts';
import { addLocalsConfiguration } from '#util/config-middleware.ts';
import { createBaseApp } from '@pins/local-plans-lib/app/app.ts';
import type { Express } from 'express';
import type { PortalService } from '#service';

/**
 * Creates and configures the Express application for the portal
 *
 * @param {PortalService} service - The portal service instance containing database, logger, and configuration
 * @returns {Express} Configured Express application with routes, middleware, and Nunjucks templating
 *
 * @example
 * ```typescript
 * const service = new PortalService(config);
 * const app = createApp(service);
 * app.listen(3000);
 * ```
 */
export function createApp(service: PortalService): Express {
	const router = buildRouter(service);
	// Create an express app and configure it for portal usage
	return createBaseApp({ service, configureNunjucks, router, middlewares: [addLocalsConfiguration()] });
}
