import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import type { Request, Response } from 'express';
import { buildAssignedToMe } from './controller.ts';
import type { ManageService } from '#service';

const entraClient = { getUserDisplayName: async (id: string) => `User ${id}` };

const account = { name: 'Officer1', localAccountId: 'officer-1' };

function createService(cases: unknown[] = []): any {
	return {
		db: {
			case: {
				findMany: mock.fn(async () => cases)
			}
		},
		logger: {
			error: mock.fn()
		},
		getEntraClient: mock.fn(() => entraClient)
	};
}

function createResponse(): any {
	const res = {
		render: mock.fn(() => res),
		status: mock.fn(() => res)
	};

	return res;
}

function createRequest(): any {
	return {
		session: {
			account
		}
	};
}

function createContext(cases: unknown[] = []) {
	const service = createService(cases);

	return {
		service,
		req: createRequest(),
		res: createResponse(),
		handler: buildAssignedToMe(service)
	};
}

describe('buildAssignedToMe', () => {
	it('renders assigned cases when fetch succeeds', async () => {
		const cases = [
			{ id: 1, caseOfficer: 'officer-1' },
			{ id: 2, caseOfficer: 'officer-1' }
		];

		const ctx = createContext(cases);

		await ctx.handler(ctx.req, ctx.res);

		assert.equal(ctx.service.db.case.findMany.mock.callCount(), 1);
		assert.deepEqual(ctx.service.db.case.findMany.mock.calls[0].arguments[0], {
			where: { caseOfficer: 'officer-1' }
		});
		assert.deepEqual(ctx.res.render.mock.calls[0].arguments, [
			'views/assigned-to-me/assigned-to-me.njk',
			{
				cases: [
					{ id: 1, caseOfficer: 'User officer-1' },
					{ id: 2, caseOfficer: 'User officer-1' }
				],
				caseOfficerText: 'Officer1'
			}
		]);
		assert.equal(ctx.res.status.mock.callCount(), 0);
	});

	it('logs and renders 500 page when fetch fails', async () => {
		const fetchError = new Error('db failed');
		const service = createService();

		service.db.case.findMany.mock.mockImplementation(async () => {
			throw fetchError;
		});

		const ctx = {
			service,
			req: createRequest(),
			res: createResponse(),
			handler: buildAssignedToMe(service)
		};

		await ctx.handler(ctx.req, ctx.res);

		assert.equal(ctx.service.db.case.findMany.mock.callCount(), 1);
		assert.equal(ctx.service.logger.error.mock.callCount(), 1);
		assert.deepEqual(ctx.service.logger.error.mock.calls[0].arguments, [
			{ error: fetchError },
			'Unable to fetch cases'
		]);
		assert.equal(ctx.res.status.mock.calls[0].arguments[0], 500);
		assert.deepEqual(ctx.res.render.mock.calls[0].arguments, ['views/errors/500.njk']);
	});

	it('renders only cases assigned to the logged in user', async () => {
		const cases = [
			{ id: 1, caseOfficer: 'officer-1' },
			{ id: 2, caseOfficer: 'officer-1' }
		];

		const ctx = createContext(cases);

		await ctx.handler(ctx.req, ctx.res);

		assert.equal(ctx.service.db.case.findMany.mock.callCount(), 1);
		assert.deepEqual(ctx.service.db.case.findMany.mock.calls[0].arguments[0], {
			where: { caseOfficer: 'officer-1' }
		});
		assert.deepEqual(ctx.res.render.mock.calls[0].arguments[1], {
			cases: [
				{ id: 1, caseOfficer: 'User officer-1' },
				{ id: 2, caseOfficer: 'User officer-1' }
			],
			caseOfficerText: 'Officer1'
		});
	});
});
