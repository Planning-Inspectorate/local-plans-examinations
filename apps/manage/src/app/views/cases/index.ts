import { ManageService } from '#service';
import { Router, Router as createRouter } from 'express';
import { listCasesController } from './controller.ts';
import { asyncHandler } from '@pins/local-plans-lib/util/async-handler.ts';

export function manageCasesRoutes(service: ManageService): Router {
	const router = createRouter({ mergeParams: true });
	const listCases = listCasesController(service);
	router.get('/', asyncHandler(listCases));

	return router;
}
