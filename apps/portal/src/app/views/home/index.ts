import { Router as createRouter } from 'express';
import { buildGuidancePage } from './controller.ts';
import { asyncHandler } from '@planning-inspectorate/core/util';
import type { IRouter } from 'express';
import { checkIsAuthenticated } from '../../auth/guards.ts';

export function createHomeRoutes(): IRouter {
	const router = createRouter({ mergeParams: true });

	router.get('/', (req, res) => res.redirect('/login'));
	router.get('/guidance', checkIsAuthenticated, asyncHandler(buildGuidancePage()));

	return router;
}
