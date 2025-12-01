import { Router as createRouter } from 'express';
import { cacheNoCacheMiddleware } from '@pins/local-plans-lib/middleware/cache.ts';
import { createErrorRoutes } from './views/static/error/index.ts';
import { createHomeRoutes } from './views/home/index.ts';
import { createQuestionnaireRoutes } from './views/questionnaire/index.ts';
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
	router.use('/questionnaire', createQuestionnaireRoutes(service));
	router.use('/error', createErrorRoutes(service));

	return router;
}
