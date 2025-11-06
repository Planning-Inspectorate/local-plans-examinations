import { Router as createRouter } from 'express';
import { asyncHandler } from '@pins/local-plans-examinations-lib/util/async-handler.ts';
import { buildListItems } from './list/controller.ts';
import type { ManageService } from '#service';
import type { IRouter } from 'express';

export function createRoutes(service: ManageService): IRouter {
	const router = createRouter({ mergeParams: true });
	const listItems = buildListItems(service);

	router.get('/', asyncHandler(listItems));

	return router;
}
