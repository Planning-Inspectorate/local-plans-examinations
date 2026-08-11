import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import type { Request, Response } from 'express';
import { buildAssignedToMe } from './controller.ts';
import type { ManageService } from '#service';
import * as authSession from '../../auth/session.service.ts';

function createHarness(findManyImpl: () => Promise<unknown>) {
	let findManyCallCount = 0;

	const findMany = async () => {
		findManyCallCount += 1;
		return findManyImpl();
	};

	const errorCalls: Array<[unknown, string?]> = [];
	const loggerError = (meta: unknown, message?: string) => {
		errorCalls.push([meta, message]);
	};

	const renderCalls: Array<[string, unknown?]> = [];
	const statusCalls: number[] = [];

	const resObj = {
		render(view: string, model?: unknown) {
			renderCalls.push([view, model]);
			return this;
		},
		status(code: number) {
			statusCalls.push(code);
			return this;
		}
	};

	const service = {
		db: { case: { findMany } },
		logger: { error: loggerError }
	} as unknown as ManageService;

	return {
		handler: buildAssignedToMe(service),
		req: {} as Request,
		res: resObj as unknown as Response,
		getFindManyCallCount: () => findManyCallCount,
		errorCalls,
		renderCalls,
		statusCalls
	};
}

describe('buildAssignedToMe', () => {
	it('renders buildAssignedToMe with cases when fetch succeeds', async () => {
		const cases = [
			{ id: 1, caseOfficer: 'officer-1' },
			{ id: 2, caseOfficer: 'officer-1' }
		];
		const account = { displayName: 'Officer1', id: 'officer-1' };
		mock.method(authSession, 'getAccount', () => account);
		mock.method(authSession, 'getAccount', () => account);
		const ctx = createHarness(async () => cases);

		await ctx.handler(ctx.req, ctx.res);

		assert.equal(ctx.getFindManyCallCount(), 1);
		assert.deepEqual(ctx.renderCalls, [['views/assigned-to-me/assigned-to-me.njk', { cases }]]);
		assert.deepEqual(ctx.statusCalls, []);
		assert.deepEqual(ctx.errorCalls, []);
	});

	it('logs and renders 500 page when fetch fails', async () => {
		const fetchError = new Error('db failed');
		const ctx = createHarness(async () => {
			throw fetchError;
		});

		await ctx.handler(ctx.req, ctx.res);

		assert.equal(ctx.getFindManyCallCount(), 1);
		assert.equal(ctx.errorCalls.length, 1);
		assert.deepEqual(ctx.errorCalls[0], [{ error: fetchError }, 'Unable to fetch cases']);
		assert.deepEqual(ctx.statusCalls, [500]);
		assert.deepEqual(ctx.renderCalls, [['views/errors/500.njk', undefined]]);
	});
	it('renders all cases assigned to logged in user', async () => {
		const cases = [{ id: 1 }, { id: 2 }];
		const account = { name: 'Officer One', localAccountId: 'officer-1' };
		mock.method(authSession, 'getAccount', () => account);
		const ctx = createHarness(async () => cases);
		await ctx.handler(ctx.req, ctx.res);

		assert.equal(ctx.getFindManyCallCount(), 1);
		assert.deepEqual(ctx.renderCalls, [['views/assigned-to-me/assigned-to-me.njk', { cases }]]);
		assert.deepEqual(ctx.statusCalls, []);
		assert.deepEqual(ctx.errorCalls, []);
	});
	it('does not render cases assigned to users other than logged in user', async () => {
		const cases = [{ id: 1 }, { id: 2 }];
		const ctx = createHarness(async () => cases);

		await ctx.handler(ctx.req, ctx.res);

		assert.equal(ctx.getFindManyCallCount(), 1);
		assert.deepEqual(ctx.renderCalls, [['views/assigned-to-me/assigned-to-me.njk', { cases }]]);
		assert.deepEqual(ctx.statusCalls, []);
		assert.deepEqual(ctx.errorCalls, []);
	});
});
