import { Router as createRouter } from 'express';
import { cacheNoCacheMiddleware } from '@planning-inspectorate/core/middleware';
import { createErrorRoutes } from './views/static/error/index.ts';
import { createCookiesRoutes } from './views/static/cookies/index.ts';
import { createHomeRoutes } from './views/home/index.ts';
import { createLandingPageRoutes } from './views/landing-page/index.ts';
import { createMonitoringRoutes } from '@planning-inspectorate/core/controllers';
import type { PortalService } from '#service';
import type { IRouter } from 'express';
import { createLoginRoutes } from './views/login/index.ts';
import { manageLocalPlansRoutes } from './views/manage-local-plans/index.ts';

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
	router.use('/manage-local-plans', manageLocalPlansRoutes(service));
	// router.use('/manage-local-plans', checkIsAuthenticated);
	// router.use('/manage-local-plans/your-plans', createLandingPageRoutes(service));
	// router.use('/manage-local-plans', createPlanPageRoutes(service));
	// router.use('/manage-local-plans', gateway2SubmissionRoutes(service));
	router.use('/', createHomeRoutes(service));
	router.use('/', createCookiesRoutes());
	router.use('/error', createErrorRoutes(service));

	return router;
}
