import { Router as createRouter } from 'express';
import { createErrorControllers } from './controller.ts';
import type { ManageService } from '#service';
import type { IRouter } from 'express';

export function createErrorRoutes(service: ManageService): IRouter {
	const router = createRouter({ mergeParams: true });
	const controllers = createErrorControllers(service);

	router.get('/firewall-error', controllers.firewallError);

	return router;
}
