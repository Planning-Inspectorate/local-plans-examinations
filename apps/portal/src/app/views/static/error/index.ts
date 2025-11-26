import { Router as createRouter } from 'express';
import { createErrorControllers } from './controller.ts';
import type { PortalService } from '#service';
import type { IRouter } from 'express';

export function createErrorRoutes(service: PortalService): IRouter {
	const router = createRouter({ mergeParams: true });
	const controllers = createErrorControllers(service);

	router.get('/firewall-error', controllers.firewallError);

	return router;
}
