import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { Request, Response } from 'express';
import { buildGetApplicationCompletePage } from './controller.ts';

const VIEW_PATH = 'views/gateway-2-application/application-complete/index.njk';

function createReq(overrides: { params?: Record<string, string> } = {}) {
	const req = {
		params: { reference: 'PLAN-001', ...overrides.params }
	} as unknown as Request;

	const renderCalls: Array<[string, unknown?]> = [];

	const res = {
		render(view: string, model?: unknown) {
			renderCalls.push([view, model]);
			return this;
		}
	} as unknown as Response;

	return { req, res, renderCalls };
}

describe('buildGetApplicationCompletePage', () => {
	it('renders the application complete page with correct view data', async () => {
		const handler = buildGetApplicationCompletePage();
		const { req, res, renderCalls } = createReq();

		await handler(req, res);

		assert.equal(renderCalls.length, 1);
		assert.equal(renderCalls[0][0], VIEW_PATH);
		const model = renderCalls[0][1] as Record<string, unknown>;
		assert.equal(model.returnToPlanUrl, '/manage-local-plans/PLAN-001');
	});
});
