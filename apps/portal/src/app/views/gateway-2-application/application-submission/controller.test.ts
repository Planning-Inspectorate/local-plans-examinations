import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { Request, Response } from 'express';
import { buildGetGateway2SubmissionPage, buildPostGateway2SubmissionPage } from './controller.ts';
import type { PortalService } from '#service';
import { buildTestPlans } from '../../../types.ts';

const VIEW_PATH = 'views/gateway-2-application/application-submission/application-submission.njk';

function createReq(overrides: { params?: Record<string, string>; body?: Record<string, unknown> } = {}) {
	const req = {
		params: { reference: 'PLAN-123456', ...overrides.params },
		body: overrides.body ?? {}
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

function createMockService() {
	const infoCalls: string[] = [];
	return {
		logger: {
			info(msg: string) {
				infoCalls.push(msg);
			}
		},
		getPlans: async () => buildTestPlans(),
		infoCalls
	} as unknown as PortalService & { infoCalls: string[] };
}

describe('buildGetGateway2SubmissionPage', () => {
	it('renders the gateway 2 submission page with correct view data', async () => {
		const service = createMockService();
		const handler = buildGetGateway2SubmissionPage(service);
		const { req, res, renderCalls } = createReq();

		await handler(req, res);

		assert.equal(renderCalls.length, 1);
		assert.equal(renderCalls[0][0], VIEW_PATH);
		const model = renderCalls[0][1] as Record<string, unknown>;
		assert.equal(model.pageTitle, 'Gateway 2 submission');
		assert.equal(model.pageHeading, 'Gateway 2 submission');
		assert.equal(model.pageCaption, 'Test plan');
		assert.equal(model.backLinkUrl, '/manage-local-plans/PLAN-123456');
		assert.equal(model.targetDate, '21 July 2026');
		assert.equal(model.saveAndComeBackUrl, '/manage-local-plans/PLAN-123456');
	});

	it('renders with empty caption and target date when plan not found', async () => {
		const service = createMockService();
		const handler = buildGetGateway2SubmissionPage(service);
		const { req, res, renderCalls } = createReq({ params: { reference: 'PLAN-999' } });

		await handler(req, res);

		assert.equal(renderCalls.length, 1);
		const model = renderCalls[0][1] as Record<string, unknown>;
		assert.equal(model.pageCaption, '');
		assert.equal(model.targetDate, '');
	});
});

describe('buildPostGateway2SubmissionPage', () => {
	it('renders error when no documents have been added', async () => {
		const service = createMockService();
		const handler = buildPostGateway2SubmissionPage(service);
		const { req, res, renderCalls } = createReq();

		await handler(req, res);

		assert.equal(renderCalls.length, 1);
		assert.equal(renderCalls[0][0], VIEW_PATH);
		const model = renderCalls[0][1] as Record<string, unknown>;
		assert.ok(model.errorSummary);
		assert.ok(model.errors);
	});

	it('error message matches acceptance criteria', async () => {
		const service = createMockService();
		const handler = buildPostGateway2SubmissionPage(service);
		const { req, res, renderCalls } = createReq();

		await handler(req, res);

		const model = renderCalls[0][1] as Record<string, unknown>;
		const errorSummary = model.errorSummary as Array<{ text: string; href: string }>;
		assert.equal(errorSummary[0].text, 'Add at least one document before submitting');
		assert.equal(errorSummary[0].href, '#procedural-documents');
	});

	it('preserves page data on validation error', async () => {
		const service = createMockService();
		const handler = buildPostGateway2SubmissionPage(service);
		const { req, res, renderCalls } = createReq();

		await handler(req, res);

		const model = renderCalls[0][1] as Record<string, unknown>;
		assert.equal(model.pageTitle, 'Gateway 2 submission');
		assert.equal(model.pageCaption, 'Test plan');
		assert.equal(model.targetDate, '21 July 2026');
		assert.equal(model.saveAndComeBackUrl, '/manage-local-plans/PLAN-123456');
	});
});
