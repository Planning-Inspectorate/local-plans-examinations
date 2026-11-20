import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import type { Request, Response } from 'express';
import { buildLandingPage } from './controller.ts';
import type { ManageService } from '#service';
import { gateway2SetIds, gateway3SetIds } from '@pins/local-plans-database/src/seed/static-data/ids/document-set.ts';

function createHarness(findManyImpl: () => Promise<unknown>, totalCases: number, page?: string) {
	let findManyCallCount = 0;
	const findManyQueries: unknown[] = [];

	const findMany = async (query: { where?: { deletedDate?: null } }) => {
		findManyCallCount += 1;
		findManyQueries.push(query);

		const result = await findManyImpl();

		if (query.where?.deletedDate === null && Array.isArray(result)) {
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
	const findDocuments = mock.fn(async (_query: unknown) => []);
	const countCases = mock.fn(async (_query: unknown) => totalCases);

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
		db: {
			case: { findMany, count: countCases },
			gateway1Info: { findUnique: async () => null },
			gateway2Info: { findUnique: async () => null },
			gateway3Info: { findUnique: async () => null },
			document: { findMany: findDocuments },
			examinationInfo: { findFirst: async () => null }
		},
		logger: { error: loggerError }
	} as unknown as ManageService;

	return {
		handler: buildLandingPage(service),
		req: { query: page ? { page } : {}, baseUrl: '', path: '/' } as Request,
		res: resObj as unknown as Response,
		getFindManyCallCount: () => findManyCallCount,
		findManyQueries,
		countCases,
		findDocuments,
		errorCalls,
		renderCalls,
		statusCalls
	};
}

describe('buildLandingPage', () => {
	it('excludes draft and deleted documents from the All cases statuses', async () => {
		const ctx = createHarness(async () => [{ id: 'case-1' }], 1);

		await ctx.handler(ctx.req, ctx.res);

		assert.deepEqual(
			ctx.findDocuments.mock.calls.map(({ arguments: [query] }) => query),
			[gateway2SetIds, gateway3SetIds].map((documentSetIds) => ({
				where: { caseId: 'case-1', documentSetId: { in: documentSetIds }, isDeleted: false, isTemp: false }
			}))
		);
	});

	it('renders landing page with cases when fetch succeeds', async () => {
		const cases = [
			{
				id: 1,
				headerStatusText: 'Awaiting SLA',
				headerStatusClasses: 'govuk-tag--yellow'
			},
			{
				id: 2,
				headerStatusText: 'Awaiting SLA',
				headerStatusClasses: 'govuk-tag--yellow'
			}
		];
		const ctx = createHarness(async () => cases, 2);

		await ctx.handler(ctx.req, ctx.res);

		assert.equal(ctx.getFindManyCallCount(), 1);
		assert.deepEqual(ctx.renderCalls, [
			[
				'views/landing-page/landing-page.njk',
				{
					cases,
					totalCases: 2,
					pagination: { previous: null, next: null, items: [] }
				}
			]
		]);
		assert.deepEqual(ctx.statusCalls, []);
		assert.deepEqual(ctx.errorCalls, []);
	});

	it('fetches and renders the requested page of cases', async () => {
		const cases = [{ id: 31 }];
		const ctx = createHarness(async () => cases, 31, '2');

		await ctx.handler(ctx.req, ctx.res);

		assert.deepEqual(ctx.countCases.mock.calls[0].arguments[0], { where: { deletedDate: null } });
		assert.deepEqual(ctx.findManyQueries, [
			{
				where: { deletedDate: null },
				orderBy: { createdAt: 'desc' },
				skip: 30,
				take: 30
			}
		]);

		const renderData = ctx.renderCalls[0][1] as {
			totalCases: number;
			pagination: unknown;
		};
		assert.equal(renderData.totalCases, 31);
		assert.deepEqual(renderData.pagination, {
			previous: { href: '?page=1' },
			next: null,
			items: [
				{ number: 1, href: '?page=1', current: false },
				{ number: 2, href: '?page=2', current: true }
			]
		});
	});

	it('logs and renders 500 page when fetch fails', async () => {
		const fetchError = new Error('db failed');
		const ctx = createHarness(async () => {
			throw fetchError;
		}, 1);

		await ctx.handler(ctx.req, ctx.res);

		assert.equal(ctx.getFindManyCallCount(), 1);
		assert.equal(ctx.errorCalls.length, 1);
		assert.deepEqual(ctx.errorCalls[0], [{ error: fetchError }, 'Unable to fetch cases']);
		assert.deepEqual(ctx.statusCalls, [500]);
		assert.deepEqual(ctx.renderCalls, [['views/errors/500.njk', undefined]]);
	});

	it('does not display cases that have a deletedDate attribute that is not null', async () => {
		const cases = [
			{ id: 1, planTitle: 'noDisplay', deletedDate: new Date('1999-07-21') },
			{
				id: 2,
				qaInspector1: 'Officer1',
				headerStatusText: 'Awaiting SLA',
				headerStatusClasses: 'govuk-tag--yellow'
			}
		];
		const ctx = createHarness(async () => cases, 1);
		await ctx.handler(ctx.req, ctx.res);

		const renderData = ctx.renderCalls[0][1] as { cases: unknown[] };

		const renderedCases = renderData.cases;

		assert.deepEqual(renderedCases, [
			{
				id: 2,
				qaInspector1: 'Officer1',
				headerStatusText: 'Awaiting SLA',
				headerStatusClasses: 'govuk-tag--yellow'
			}
		]);
	});
});
