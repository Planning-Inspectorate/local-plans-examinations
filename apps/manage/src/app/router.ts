import { Router as createRouter } from 'express';
import { createRoutesAndGuards as createAuthRoutesAndGuards } from './auth/router.ts';
import { createMonitoringRoutes } from '@pins/local-plans-lib/controllers/monitoring.ts';
import { createErrorRoutes } from './views/static/error/index.ts';
import { createQuestionnaireRoutes } from './views/questionnaire/index.ts';
import { cacheNoCacheMiddleware } from '@pins/local-plans-lib/middleware/cache.ts';
import type { ManageService } from '#service';
import type { IRouter } from 'express';
import { createACaseRoutes } from './views/create-a-case/index.ts';
import { homePage } from './views/home/controller.ts';
import { manageCasesRoutes } from './views/cases/index.ts';
import { caseDetailRoutes } from './views/case-detail/index.ts';

/**
 * Main app router
 */
export function buildRouter(service: ManageService): IRouter {
	const router = createRouter();
	const monitoringRoutes = createMonitoringRoutes(service);
	const { router: authRoutes, guards: authGuards } = createAuthRoutesAndGuards(service);

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

	router.get('/', homePage);
	router.use('/questionnaire', createQuestionnaireRoutes(service));
	router.use('/error', createErrorRoutes(service));
	router.use('/create-a-case', createACaseRoutes(service));
	router.use('/cases', manageCasesRoutes(service));
	router.use('/cases/:id', caseDetailRoutes(service));

	return router;
}
