import { Router as createRouter } from 'express';
import { cacheNoCacheMiddleware } from '@pins/local-plans-lib/middleware/cache.ts';
import { createErrorRoutes } from './views/static/error/index.ts';
import { createHomeRoutes } from './views/home/index.ts';
import { createPortalForm } from '@pins/local-plans-lib';
import { createMonitoringRoutes } from '@pins/local-plans-lib/controllers/monitoring.ts';
import type { PortalService } from '#service';
import type { IRouter } from 'express';

/**
 * Main app router
 */
export function buildRouter(service: PortalService): IRouter {
	const router = createRouter();

	const monitoringRoutes = createMonitoringRoutes(service);

	router.use('/', monitoringRoutes);

	// don't cache responses, note no-cache allows some caching, but with revalidation
	// see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control#no-cache
	router.use(cacheNoCacheMiddleware);

	router.use('/', createHomeRoutes(service));
	const feedbackForm = createPortalForm(service);
	router.use('/feedback', feedbackForm.router);
	router.use('/error', createErrorRoutes(service));

	return router;
}
