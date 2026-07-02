import { Router as createRouter } from 'express';
import { createRoutesAndGuards as createAuthRoutesAndGuards } from './auth/router.ts';
import { createMonitoringRoutes } from '@pins/local-plans-lib/controllers/monitoring.ts';
import { createErrorRoutes } from './views/static/error/index.ts';
import { createNotifyRoutes } from './notify/router.ts';
import { cacheNoCacheMiddleware } from '@pins/local-plans-lib/middleware/cache.ts';
import type { ManageService } from '#service';
import type { IRouter } from 'express';
import { createLandingPageRoutes } from './views/landing-page/index.ts';
import { createACaseRoutes } from './views/create-a-case/index.ts';
import { caseRouter } from './views/case/index.ts';

/**
 * Main app router
 */
export function buildRouter(service: ManageService): IRouter {
	const router = createRouter();
	const monitoringRoutes = createMonitoringRoutes(service);
	const { router: authRoutes, guards: authGuards } = createAuthRoutesAndGuards(service);
	// const caseRoutes = caseRouter(service);

	router.use('/', monitoringRoutes);

	// don't cache responses, note no-cache allows some caching, but with revalidation
	// see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control#no-cache
	router.use(cacheNoCacheMiddleware);

	router.get('/unauthenticated', (req, res) => res.status(401).render('views/errors/401.njk'));

	if (!service.authDisabled) {
		service.logger.info('registering auth routes');
		router.use('/auth', authRoutes);

		// all subsequent routes require auth

		// check logged in
		router.use(authGuards.assertIsAuthenticated);
		// check group membership
		router.use(authGuards.assertGroupAccess);
	} else {
		service.logger.warn('auth disabled; auth routes and guards skipped');
	}

	if (service.notifyCallbackEnabled) {
		service.logger.info('registering notify callback routes');
		router.use('/notify', createNotifyRoutes(service));
	}

	router.use('/', createLandingPageRoutes(service));
	router.use('/case/:reference', caseRouter(service));
	router.use('/error', createErrorRoutes(service));
	router.use('/create-a-case', createACaseRoutes(service));

	return router;
}
