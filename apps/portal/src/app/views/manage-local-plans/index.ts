import type { PortalService } from '#service';
import { type IRouter, Router as createRouter } from 'express';
import { asyncHandler } from '@planning-inspectorate/core/util';
import { gateway2SubmissionRoutes } from './gateway-2-submission/index.ts';
import { createLandingPageRoutes } from '../landing-page/index.ts';
import { buildPlanPage } from '../plan-page/controller.ts';
import { checkIsAuthenticated } from '../../auth/guards.ts';

export function manageLocalPlansRoutes(service: PortalService): IRouter {
	const router = createRouter({ mergeParams: true });
	const planPageController = buildPlanPage(service);
	router.use('/', checkIsAuthenticated);
	router.use('/your-plans', createLandingPageRoutes(service));
	router.use('/:planReference/gateway-2-submission', asyncHandler(gateway2SubmissionRoutes(service)));
	router.get('/:refNum', asyncHandler(planPageController));

	return router;
}
