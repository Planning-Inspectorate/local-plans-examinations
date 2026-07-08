import { type IRouter, Router as createRouter } from 'express';
import { buildGetDeclarationPage, buildPostDeclarationPage } from './controller.ts';
import { asyncHandler } from '@pins/local-plans-lib/util/async-handler.ts';
import type { PortalService } from '#service';

export function createApplicationDeclarationRoutes(service: PortalService): IRouter {
	const router = createRouter({ mergeParams: true });

	router.get('/', asyncHandler(buildGetDeclarationPage()));
	router.post('/', asyncHandler(buildPostDeclarationPage(service)));

	return router;
}
