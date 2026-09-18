import type { PortalService } from '#service';
import { type IRouter, Router as createRouter } from 'express';
import { asyncHandler } from '@planning-inspectorate/core/util';
import { gateway2SubmissionRoutes } from './gateway-2-submission/index.ts';
import { createLandingPageRoutes } from '../landing-page/index.ts';
import { buildPlanPage } from '../plan-page/controller.ts';
import { gateway3SubmissionRoutes } from './gateway-3-submission/index.ts';

export function manageLocalPlansRoutes(service: PortalService): IRouter {
	const router = createRouter({ mergeParams: true });
	const planPageController = buildPlanPage(service);
	router.use('/your-plans', createLandingPageRoutes(service));
	router.get('/:planReference', asyncHandler(planPageController));
	router.use('/:planReference/gateway-2-submission', asyncHandler(gateway2SubmissionRoutes(service)));
	router.use('/:planReference/gateway-3-submission', asyncHandler(gateway3SubmissionRoutes(service)));

	return router;
}
