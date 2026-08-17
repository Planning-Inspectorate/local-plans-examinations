import { type IRouter, Router as createRouter } from 'express';
import { buildGetApplicationCompletePage } from './controller.ts';
import { asyncHandler } from '@pins/local-plans-lib/util/async-handler.ts';

export function createApplicationCompleteRoutes(): IRouter {
	const router = createRouter({ mergeParams: true });

	router.get('/', asyncHandler(buildGetApplicationCompletePage()));

	return router;
}
