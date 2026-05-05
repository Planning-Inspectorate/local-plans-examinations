import { Router as createRouter } from 'express';
import { getMyPlans } from './controller.ts';
import type { IRouter } from 'express';

export function createMyPlansRoutes(): IRouter {
	const router = createRouter({ mergeParams: true });

	router.get('/my-plans', getMyPlans());

	return router;
}
