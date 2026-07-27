import { type IRouter, Router as createRouter } from 'express';
import { buildGetGateway2SubmissionPage, buildPostGateway2SubmissionPage } from './controller.ts';
import { asyncHandler } from '@pins/local-plans-lib/util/async-handler.ts';
import type { PortalService } from '#service';

export function createApplicationSubmissionRoutes(service: PortalService): IRouter {
	const router = createRouter({ mergeParams: true });

	router.get('/', asyncHandler(buildGetGateway2SubmissionPage(service)));
	router.post('/', asyncHandler(buildPostGateway2SubmissionPage(service)));

	return router;
}
