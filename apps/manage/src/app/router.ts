import { Router as createRouter } from 'express';
import rateLimit from 'express-rate-limit';
import { createRoutesAndGuards as createAuthRoutesAndGuards } from './auth/router.ts';
import { authRateLimitOptions } from './auth/rate-limit.ts';
import { createMonitoringRoutes } from '@pins/local-plans-lib/controllers/monitoring.ts';
import { createErrorRoutes } from './views/static/error/index.ts';
import { createNotifyRoutes } from './notify/router.ts';
import { cacheNoCacheMiddleware } from '@pins/local-plans-lib/middleware/cache.ts';
import type { ManageService } from '#service';
import type { IRouter, NextFunction, Response, Request } from 'express';
import { createLandingPageRoutes } from './views/landing-page/index.ts';
import { createAssignedToMeRoutes } from './views/assigned-to-me/index.ts';
import { createACaseRoutes } from './views/create-a-case/index.ts';
import { caseRouter } from './views/case/index.ts';
import { clearDataFromSession } from '@planning-inspectorate/dynamic-forms';
import { JOURNEY_ID } from './views/create-a-case/journey.ts';

function clearCreateCaseWhenLeaving(req: Request, _: Response, next: NextFunction) {
	if (req.session?.currentJourney === JOURNEY_ID && !req.path.startsWith('/create-a-case')) {
		clearDataFromSession({ req, journeyId: JOURNEY_ID });
		delete req.session.currentJourney;
		delete req.session.editingFromCheckAnswers;
	}
	next();
}

/**
 * Main app router
 */
export function buildRouter(service: ManageService): IRouter {
	const router = createRouter();
	const monitoringRoutes = createMonitoringRoutes(service);
	const { router: authRoutes, guards: authGuards } = createAuthRoutesAndGuards(service);

	router.use(clearCreateCaseWhenLeaving);
	router.use('/', monitoringRoutes);

	// don't cache responses, note no-cache allows some caching, but with revalidation
	// see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control#no-cache
	router.use(cacheNoCacheMiddleware);

	router.get('/unauthenticated', (req, res) => res.status(401).render('views/errors/401.njk'));

	if (!service.authDisabled) {
		service.logger.info('registering auth routes');
		router.use(rateLimit(authRateLimitOptions));
		router.use('/auth', authRoutes);

		// all subsequent routes require auth
		router.use(authGuards.assertIsAuthenticated, authGuards.assertGroupAccess);
	} else {
		service.logger.warn('auth disabled; auth routes and guards skipped');
	}

	if (service.notifyCallbackEnabled) {
		service.logger.info('registering notify callback routes');
		router.use('/notify', createNotifyRoutes(service));
	}

	router.use('/', createLandingPageRoutes(service));
	router.use('/assigned-to-me', createAssignedToMeRoutes(service));
	router.use('/case/:reference', caseRouter(service));
	router.use('/error', createErrorRoutes(service));
	router.use('/create-a-case', createACaseRoutes(service));

	return router;
}
