import { describe, it, mock } from 'node:test';
import assert from 'node:assert';
import { createQuestionnaireRoutes } from './index.ts';
import type { ManageService } from '#service';

describe('Questionnaire Router', () => {
	const mockService = {
		db: {
			questionnaire: {
				findMany: mock.fn(() => Promise.resolve([])),
				findUnique: mock.fn(() => Promise.resolve(null)),
				count: mock.fn(() => Promise.resolve(0))
			}
		},
		logger: {
			info: mock.fn(),
			error: mock.fn(),
			warn: mock.fn(),
			debug: mock.fn()
		}
	} as unknown as ManageService;

	it('should create router with all routes', () => {
		const router = createQuestionnaireRoutes(mockService);
		assert.ok(router);
		assert.strictEqual(typeof router, 'function');
	});

	it('should setup list route', () => {
		const router = createQuestionnaireRoutes(mockService);
		const stack = (router as any).stack;

		const listRoute = stack.find((layer: any) => layer.route?.path === '/' && layer.route?.methods?.get);
		assert.ok(listRoute, 'List route should exist');
	});

	it('should setup detail route', () => {
		const router = createQuestionnaireRoutes(mockService);
		const stack = (router as any).stack;

		const detailRoute = stack.find((layer: any) => layer.route?.path === '/:id' && layer.route?.methods?.get);
		assert.ok(detailRoute, 'Detail route should exist');
	});

	it('should setup delete confirmation route', () => {
		const router = createQuestionnaireRoutes(mockService);
		const stack = (router as any).stack;

		const deleteConfirmRoute = stack.find(
			(layer: any) => layer.route?.path === '/:id/delete' && layer.route?.methods?.get
		);
		assert.ok(deleteConfirmRoute, 'Delete confirmation route should exist');
	});

	it('should setup delete route', () => {
		const router = createQuestionnaireRoutes(mockService);
		const stack = (router as any).stack;

		const deleteRoute = stack.find((layer: any) => layer.route?.path === '/:id/delete' && layer.route?.methods?.post);
		assert.ok(deleteRoute, 'Delete route should exist');
	});

	it('should setup edit GET route', () => {
		const router = createQuestionnaireRoutes(mockService);
		const stack = (router as any).stack;

		const editRoute = stack.find(
			(layer: any) => layer.route?.path === '/:id/edit/:section/:question' && layer.route?.methods?.get
		);
		assert.ok(editRoute, 'Edit GET route should exist');
	});

	it('should setup edit POST route', () => {
		const router = createQuestionnaireRoutes(mockService);
		const stack = (router as any).stack;

		const editRoute = stack.find(
			(layer: any) => layer.route?.path === '/:id/edit/:section/:question' && layer.route?.methods?.post
		);
		assert.ok(editRoute, 'Edit POST route should exist');
	});

	it('should have middleware for edit routes', () => {
		const router = createQuestionnaireRoutes(mockService);
		const stack = (router as any).stack;

		// Verify router has middleware layers (not just routes)
		const hasMiddleware = stack.some((layer: any) => !layer.route);
		assert.ok(hasMiddleware, 'Router should have middleware layers');
	});
});
