import { type IRouter, Router as createRouter } from 'express';
import { buildGetGateway2ApplicationPage } from './controller.ts';
import { asyncHandler } from '@pins/local-plans-lib/util/async-handler.ts';

export function createGateway2ApplicationRoutes(): IRouter {
	const router = createRouter({ mergeParams: true });

	router.get('/', asyncHandler(buildGetGateway2ApplicationPage()));

	return router;
}
