import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { Request, Response } from 'express';
import { buildGetGateway2ApplicationPage } from './controller.ts';

const VIEW_PATH = 'views/gateway-2-application/index.njk';

function createReq(overrides: { params?: Record<string, string> } = {}) {
	const req = {
		params: { reference: 'PLAN-123456', ...overrides.params }
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

describe('buildGetGateway2ApplicationPage', () => {
	it('renders the gateway 2 application page with correct view data', async () => {
		const handler = buildGetGateway2ApplicationPage();
		const { req, res, renderCalls } = createReq();

		await handler(req, res);

		assert.equal(renderCalls.length, 1);
		assert.equal(renderCalls[0][0], VIEW_PATH);
		const model = renderCalls[0][1] as Record<string, unknown>;
		assert.equal(model.pageTitle, 'Gateway 2 application');
		assert.equal(model.pageHeading, 'Gateway 2 application');
		assert.equal(model.pageCaption, 'Your application');
		assert.equal(model.backLinkUrl, '/manage-local-plans/PLAN-123456');
	});
});
