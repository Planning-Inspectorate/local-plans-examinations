import { Router as createRouter } from 'express';
import { cacheNoCacheMiddleware } from '@pins/local-plans-lib/middleware/cache.ts';
import { createErrorRoutes } from './views/static/error/index.ts';
import { createCookiesRoutes } from './views/static/cookies/index.ts';
import { createHomeRoutes } from './views/home/index.ts';
import { createLandingPageRoutes } from './views/landing-page/index.ts';
import { createPlanPageRoutes } from './views/plan-page/index.ts';
import { gateway2SubmissionRoutes } from './views/manage-local-plan/gateway-2-submission/index.ts';
import { createMonitoringRoutes } from '@pins/local-plans-lib/controllers/monitoring.ts';
import type { PortalService } from '#service';
import type { IRouter } from 'express';
import { createLoginRoutes } from './views/login/index.ts';
import { createApplicationDeclarationRoutes } from './views/gateway-2-application/application-declaration/index.ts';
import { createApplicationSubmissionRoutes } from './views/gateway-2-application/application-submission/index.ts';
import { createApplicationCompleteRoutes } from './views/gateway-2-application/application-complete/index.ts';

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
	router.use('/login', createLoginRoutes(service));
	router.use('/landingPage', createLandingPageRoutes(service));
	router.use('/manage-local-plans/your-plans', createLandingPageRoutes(service));
	router.use('/manage-local-plans', createPlanPageRoutes(service));
	router.use('/manage-local-plan', gateway2SubmissionRoutes(service));
	router.use('/', createHomeRoutes(service));
	router.use('/', createCookiesRoutes());
	router.use('/error', createErrorRoutes(service));
	router.use(
		'/manage-local-plans/:reference/gateway-2-application/application-declaration',
		createApplicationDeclarationRoutes(service)
	);
	router.use('/manage-local-plans/:reference/gateway-2-application', createApplicationSubmissionRoutes(service));
	router.use(
		'/manage-local-plans/:reference/gateway-2-application/application-complete',
		createApplicationCompleteRoutes()
	);

	return router;
}
