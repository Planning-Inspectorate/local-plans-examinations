import { Router as createRouter } from 'express';
import { createMonitoringRoutes } from '@pins/local-plans-lib/controllers/monitoring.ts';
import { createHomeRoutes } from './views/home/index.ts';
import { createQuestionnaireRoutes as questionnaireRoutes } from './views/questionnaire/index.ts';
import { createErrorRoutes } from './views/static/error/index.ts';
import { cacheNoCacheMiddleware } from '@pins/local-plans-lib/middleware/cache.ts';
import type { PortalService } from '#service';
import type { IRouter } from 'express';

// Configures main router with monitoring, home, questionnaire, and error routes
export function buildRouter(service: PortalService): IRouter {
	const router = createRouter();

	// Health check and monitoring endpoints
	const monitoringRoutes = createMonitoringRoutes(service);
	router.use('/', monitoringRoutes);

	// Disable caching for dynamic content
	// Note: no-cache allows some caching but with revalidation
	// See: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control#no-cache
	router.use(cacheNoCacheMiddleware);

	// Application routes
	router.use('/', createHomeRoutes(service));
	router.use('/questionnaire', questionnaireRoutes(service));
	router.use('/error', createErrorRoutes(service));

	return router;
}
