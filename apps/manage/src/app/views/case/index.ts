import { type IRouter, Router as createRouter } from 'express';
import { buildCasePage } from './controller.ts';
import { asyncHandler } from '@pins/local-plans-lib/util/async-handler.ts';
import type { ManageService } from '#service';

export function caseRouter(service: ManageService): IRouter {
	const router = createRouter({ mergeParams: true });
	const casePage = buildCasePage(service);

	router.get('/:reference', asyncHandler(casePage));
	return router;
}
