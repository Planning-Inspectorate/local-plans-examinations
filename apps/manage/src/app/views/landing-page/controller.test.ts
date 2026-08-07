import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { Request, Response } from 'express';
import { buildLandingPage } from './controller.ts';
import type { ManageService } from '#service';

function createHarness(findManyImpl: () => Promise<unknown>) {
	let findManyCallCount = 0;

	const findMany = async ({ where }: { where?: { deletedDate?: null } }) => {
		findManyCallCount += 1;

		const result = await findManyImpl();

		if (where?.deletedDate === null && Array.isArray(result)) {
			return result.filter((item) => item.deletedDate === null || item.deletedDate === undefined);
		}

		return result;
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
		handler: buildLandingPage(service),
		req: {} as Request,
		res: resObj as unknown as Response,
		getFindManyCallCount: () => findManyCallCount,
		errorCalls,
		renderCalls,
		statusCalls
	};
}

describe('buildLandingPage', () => {
	it('renders landing page with cases when fetch succeeds', async () => {
		const cases = [{ id: 1 }, { id: 2 }];
		const ctx = createHarness(async () => cases);

		await ctx.handler(ctx.req, ctx.res);

		assert.equal(ctx.getFindManyCallCount(), 1);
		assert.deepEqual(ctx.renderCalls, [['views/landing-page/landing-page.njk', { cases }]]);
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

	it('does not display cases that have a deletedDate attribute that is not null', async () => {
		const cases = [{ id: 1, planTitle: 'noDisplay', deletedDate: new Date('1999-07-21') }, { id: 2 }];
		const ctx = createHarness(async () => cases);
		await ctx.handler(ctx.req, ctx.res);

		const renderData = ctx.renderCalls[0][1] as { cases: unknown[] };

		const renderedCases = renderData.cases;

		assert.deepEqual(renderedCases, [{ id: 2 }]);
	});
});
