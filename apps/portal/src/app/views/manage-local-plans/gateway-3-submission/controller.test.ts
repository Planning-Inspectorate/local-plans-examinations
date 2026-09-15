import assert from 'node:assert';
import { describe, it } from 'node:test';
import { buildGetJourneyResponseFromCase, buildGateway3CheckAnswersList, setGateway3ViewData } from './controller.ts';
import type { PortalService } from '#service';
import type { NextFunction, Request, Response } from 'express';

function buildMockService(caseRecord: unknown) {
	return {
		db: {
			case: {
				findUnique: async () => caseRecord
			}
		}
	} as unknown as PortalService;
}

function buildMockResponse() {
	const calls: { method: string; args: unknown[] }[] = [];
	const res = {
		status(code: number) {
			calls.push({ method: 'status', args: [code] });
			return res;
		},
		render(view: string, data: unknown) {
			calls.push({ method: 'render', args: [view, data] });
		},
		locals: {}
	} as unknown as Response;
	return { res, calls };
}

describe('buildGetJourneyResponseFromCase', () => {
	it('loads the case and calls next when a matching reference is found', async () => {
		const currentCase = { id: 'case-1', reference: 'PLAN-001', planTitle: 'Test' };
		const handler = buildGetJourneyResponseFromCase(buildMockService(currentCase));
		const req = { params: { planReference: 'PLAN-001' } } as unknown as Request;
		const { res } = buildMockResponse();
		let called = false;
		const next = () => {
			called = true;
		};

		await handler(req, res, next as NextFunction);

		assert.strictEqual(called, true);
		assert.strictEqual((req as any).currentCase, currentCase);
		assert.ok(res.locals.journeyResponse);
	});

	it('renders 404 when the plan reference is missing', async () => {
		const handler = buildGetJourneyResponseFromCase(buildMockService(null));
		const req = { params: {} } as unknown as Request;
		const { res, calls } = buildMockResponse();

		await handler(req, res, () => {});

		assert.strictEqual(calls[0].method, 'status');
		assert.strictEqual(calls[0].args[0], 404);
		assert.strictEqual(calls[1].method, 'render');
		assert.strictEqual(calls[1].args[0], 'views/layouts/error');
	});

	it('renders 404 when no case matches the reference', async () => {
		const handler = buildGetJourneyResponseFromCase(buildMockService(null));
		const req = { params: { planReference: 'PLAN-UNKNOWN' } } as unknown as Request;
		const { res, calls } = buildMockResponse();

		await handler(req, res, () => {});

		assert.strictEqual(calls[0].method, 'status');
		assert.strictEqual(calls[0].args[0], 404);
		assert.strictEqual(calls[1].method, 'render');
		assert.strictEqual(calls[1].args[0], 'views/layouts/error');
	});
});

describe('setGateway3ViewData', () => {
	it('sets view locals and calls next', () => {
		const req = { currentCase: { planTitle: 'Test Plan' }, params: {} } as unknown as Request;
		const res = { locals: {} } as unknown as Response;
		let called = false;
		const next = () => {
			called = true;
		};

		setGateway3ViewData(req, res, next as NextFunction);

		assert.strictEqual(res.locals.pageTitle, 'Gateway 3 submission');
		assert.strictEqual(called, true);
	});
});

describe('buildGateway3CheckAnswersList', () => {
	it('returns a request handler', () => {
		const handler = buildGateway3CheckAnswersList();
		assert.strictEqual(typeof handler, 'function');
	});
});
