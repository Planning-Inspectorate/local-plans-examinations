import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { Request, Response } from 'express';
import { buildCasePage } from './controller.ts';
import type { ManageService } from '#service';

function createHarness(
	findUniqueImpl: (args: unknown) => Promise<unknown>,
	reference: string | string[] | undefined = 'PLAN/123456'
) {
	let findUniqueCallCount = 0;
	let findUniqueArgs: unknown;

	const findUnique = async (args: unknown) => {
		findUniqueCallCount += 1;
		findUniqueArgs = args;
		return findUniqueImpl(args);
	};

	const errorCalls: string[] = [];
	const loggerError = (message: string) => {
		errorCalls.push(message);
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
		db: { case: { findUnique } },
		logger: { error: loggerError }
	} as unknown as ManageService;

	return {
		handler: buildCasePage(service),
		req: { params: { reference } } as unknown as Request,
		res: resObj as unknown as Response,
		getFindUniqueCallCount: () => findUniqueCallCount,
		getFindUniqueArgs: () => findUniqueArgs,
		errorCalls,
		renderCalls,
		statusCalls
	};
}

describe('buildCasePage', () => {
	it('renders case details when the case exists', async () => {
		const currentCase = {
			reference: 'PLAN/123456',
			planTitle: 'Southshire Local Plan',
			gateway1Date: new Date('2024-01-01'),
			gateway2Date: new Date('2024-06-15'),
			gateway3Date: null,
			submissionDate: null,
			lpas: [{ lpaCode: 'E123' }]
		};
		const ctx = createHarness(async () => currentCase);

		await ctx.handler(ctx.req, ctx.res);

		assert.equal(ctx.getFindUniqueCallCount(), 1);
		assert.deepEqual(ctx.getFindUniqueArgs(), {
			where: { reference: 'PLAN/123456' },
			include: { lpas: true }
		});
		assert.deepEqual(ctx.statusCalls, []);
		assert.deepEqual(ctx.errorCalls, []);
		assert.equal(ctx.renderCalls.length, 1);
		assert.equal(ctx.renderCalls[0]?.[0], 'views/case/case.njk');
		const renderData = ctx.renderCalls[0]?.[1] as Record<string, unknown>;
		assert.equal(renderData.backLinkUrl, '/your-plans');
		assert.equal(renderData.backLinkText, 'Back to my plans');
		assert.equal(renderData.pageTitle, 'PLAN/123456');
		assert.equal(renderData.pageHeading, 'Southshire Local Plan');
		assert.equal(renderData.pageCaption, 'PLAN/123456');
		assert.equal(renderData.currentStage, 'Gateway 2');
		assert.equal(renderData.status, 'In progress');
		assert.equal(renderData.statusColor, 'govuk-tag--blue');
		assert.equal(renderData.primaryLpa, 'E123');
		assert.deepEqual(renderData.linkedLpas, []);
	});

	it('decodes the reference before fetching the case', async () => {
		const currentCase = {
			reference: 'PLAN/123456',
			planTitle: 'Southshire Local Plan',
			gateway1Date: new Date('2024-01-01'),
			gateway2Date: null,
			gateway3Date: null,
			submissionDate: null,
			lpas: [{ lpaCode: 'E123' }]
		};
		const ctx = createHarness(async () => currentCase, 'PLAN%2F123456');

		await ctx.handler(ctx.req, ctx.res);

		assert.equal(ctx.getFindUniqueCallCount(), 1);
		assert.deepEqual(ctx.getFindUniqueArgs(), {
			where: { reference: 'PLAN/123456' },
			include: { lpas: true }
		});
		assert.deepEqual(ctx.statusCalls, []);
		assert.deepEqual(ctx.errorCalls, []);
		const renderData = ctx.renderCalls[0]?.[1] as Record<string, unknown>;
		assert.equal(renderData.backLinkUrl, '/your-plans');
		assert.equal(renderData.backLinkText, 'Back to my plans');
		assert.equal(renderData.currentStage, 'Gateway 1');
		assert.equal(renderData.status, 'Completed');
		assert.equal(renderData.statusColor, '');
	});

	it('uses the first reference when an array is provided', async () => {
		const currentCase = {
			reference: 'PLAN/123456',
			planTitle: 'Southshire Local Plan',
			gateway1Date: new Date('2024-01-01'),
			gateway2Date: null,
			gateway3Date: null,
			submissionDate: null,
			lpas: [{ lpaCode: 'E123' }]
		};
		const ctx = createHarness(async () => currentCase, ['PLAN%2F123456', 'IGNORED']);

		await ctx.handler(ctx.req, ctx.res);

		assert.equal(ctx.getFindUniqueCallCount(), 1);
		assert.deepEqual(ctx.getFindUniqueArgs(), {
			where: { reference: 'PLAN/123456' },
			include: { lpas: true }
		});
		assert.deepEqual(ctx.statusCalls, []);
		assert.deepEqual(ctx.errorCalls, []);
		const renderData = ctx.renderCalls[0]?.[1] as Record<string, unknown>;
		assert.equal(renderData.backLinkUrl, '/your-plans');
		assert.equal(renderData.backLinkText, 'Back to my plans');
		assert.equal(renderData.currentStage, 'Gateway 1');
		assert.equal(renderData.status, 'Completed');
		assert.equal(renderData.statusColor, '');
	});

	it('renders 404 page when the case cannot be found', async () => {
		const ctx = createHarness(async () => null);

		await ctx.handler(ctx.req, ctx.res);

		assert.equal(ctx.getFindUniqueCallCount(), 1);
		assert.deepEqual(ctx.getFindUniqueArgs(), {
			where: { reference: 'PLAN/123456' },
			include: { lpas: true }
		});
		assert.deepEqual(ctx.statusCalls, [404]);
		assert.deepEqual(ctx.errorCalls, []);
		assert.deepEqual(ctx.renderCalls, [['views/errors/404.njk', undefined]]);
	});

	it('renders 404 page when the reference is missing', async () => {
		const ctx = createHarness(async () => null, '');

		await ctx.handler(ctx.req, ctx.res);

		assert.equal(ctx.getFindUniqueCallCount(), 0);
		assert.deepEqual(ctx.statusCalls, [404]);
		assert.deepEqual(ctx.errorCalls, []);
		assert.deepEqual(ctx.renderCalls, [['views/errors/404.njk', undefined]]);
	});

	it('renders 404 page when the reference encoding is invalid', async () => {
		const ctx = createHarness(async () => null, '%E0%A4%A');

		await ctx.handler(ctx.req, ctx.res);

		assert.equal(ctx.getFindUniqueCallCount(), 0);
		assert.deepEqual(ctx.statusCalls, [404]);
		assert.deepEqual(ctx.errorCalls, []);
		assert.deepEqual(ctx.renderCalls, [['views/errors/404.njk', undefined]]);
	});

	it('logs and renders 500 page when fetch fails', async () => {
		const fetchError = new Error('db failed');
		const ctx = createHarness(async () => {
			throw fetchError;
		});

		await ctx.handler(ctx.req, ctx.res);

		assert.equal(ctx.getFindUniqueCallCount(), 1);
		assert.equal(ctx.errorCalls.length, 1);
		assert.match(ctx.errorCalls[0] ?? '', /Unable to fetch case PLAN\/123456/);
		assert.deepEqual(ctx.statusCalls, [500]);
		assert.deepEqual(ctx.renderCalls, [['views/errors/500.njk', undefined]]);
	});
});
