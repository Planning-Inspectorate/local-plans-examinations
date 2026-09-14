import { type IRouter, Router as createRouter } from 'express';
import { buildGetApplicationCompletePage } from './controller.ts';
import { asyncHandler } from '@planning-inspectorate/core/util';

export function createApplicationCompleteRoutes(): IRouter {
	const router = createRouter({ mergeParams: true });

	router.get('/', asyncHandler(buildGetApplicationCompletePage()));

	return router;
}
