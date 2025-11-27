import { Router as createRouter } from 'express';
import { firewallErrorPage } from './controller.ts';
import type { ManageService } from '#service';
import type { IRouter } from 'express';

export function createErrorRoutes(service: ManageService): IRouter {
	const router = createRouter({ mergeParams: true });

	router.get('/firewall-error', firewallErrorPage(service));

	return router;
}
