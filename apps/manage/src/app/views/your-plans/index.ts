import { type IRouter, Router as createRouter } from 'express';
import { buildYourPlansPage } from './controller.ts';
import { asyncHandler } from '@pins/local-plans-lib/util/async-handler.ts';
import type { ManageService } from '#service';

export function createYourPlansRoutes(service: ManageService): IRouter {
	const router = createRouter({ mergeParams: true });
	const yourPlansPage = buildYourPlansPage(service);

	router.get('/your-plans', asyncHandler(yourPlansPage));
	return router;
}
