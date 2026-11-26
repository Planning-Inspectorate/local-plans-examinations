import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import type { Request, Response } from 'express';
import { buildAssignedToMe } from './controller.ts';
import type { ManageService } from '#service';
import {
	DOCUMENT_SET_ID,
	gateway2SetIds,
	gateway3SetIds
} from '@pins/local-plans-database/src/seed/static-data/ids/document-set.ts';

const account = { name: 'Officer1', localAccountId: 'officer-1' };

function createService(cases: unknown[] = [], totalCases = cases.length, authDisabled = false): any {
	return {
		authDisabled,
		db: {
			case: {
				findMany: mock.fn(async () => cases),
				count: mock.fn(async () => totalCases)
			},
			gateway1Info: {
				findUnique: mock.fn(async () => null)
			},
			gateway2Info: {
				findUnique: mock.fn(async () => null)
			},
			gateway3Info: {
				findUnique: mock.fn(async () => null)
			},
			document: {
				findMany: mock.fn(async () => [])
			},
			examinationInfo: { findFirst: async () => null }
		},
		logger: {
			error: mock.fn()
		}
	};
}

function createResponse(): any {
	const res = {
		render: mock.fn(() => res),
		status: mock.fn(() => res)
	};

	return res;
}

function createRequest(page?: string): any {
	return {
		session: {
			account
		},
		query: page ? { page } : {},
		baseUrl: '/assigned-to-me',
		path: '/'
	};
}

function createContext(cases: unknown[] = [], totalCases = cases.length, page?: string, authDisabled = false) {
	const service = createService(cases, totalCases, authDisabled);

	return {
		service,
		req: createRequest(page),
		res: createResponse(),
		handler: buildAssignedToMe(service)
	};
}

describe('buildAssignedToMe', () => {
	it('excludes draft and deleted documents from assigned case statuses', async () => {
		const ctx = createContext([{ id: 'case-1', caseOfficer: account.localAccountId }]);

		await ctx.handler(ctx.req, ctx.res);

		assert.deepEqual(
			ctx.service.db.document.findMany.mock.calls.map(({ arguments: [query] }) => query),
			[gateway2SetIds, gateway3SetIds].map((documentSetIds) => ({
				where: { caseId: 'case-1', documentSetId: { in: documentSetIds }, isDeleted: false, isTemp: false }
			}))
		);
	});

	it('renders assigned cases when fetch succeeds', async () => {
		const cases = [
			{
				id: 1,
				caseOfficer: 'officer-1',
				headerStatusText: 'Awaiting SLA',
				headerStatusClasses: 'govuk-tag--yellow'
			},
			{
				id: 2,
				caseOfficer: 'officer-2',
				headerStatusText: 'Awaiting SLA',
				headerStatusClasses: 'govuk-tag--yellow'
			}
		];

		const ctx = createContext(cases);

		await ctx.handler(ctx.req, ctx.res);

		assert.equal(ctx.service.db.case.findMany.mock.callCount(), 1);
		assert.deepEqual(ctx.service.db.case.findMany.mock.calls[0].arguments[0], {
			where: {
				deletedDate: null,
				OR: [
					{ caseOfficer: 'officer-1' },
					{ assessorGateway3: 'officer-1' },
					//{ qaInspector1: 'officer-1' },
					//{ qaInspector2: 'officer-1' },
					//{ qaInspector3: 'officer-1' },
					{ gateway2Info: { assessorName: 'officer-1' } },
					{ gateway2Info: { additionalAssessors: { some: { assessorName: 'officer-1' } } } },
					//{gateway3Info:
					//	{assessorName: 'officer-1'}
					//},
					{
						examinationInfo: {
							OR: [
								//{assessorName: 'officer-1'},
								{ examiningInspector1: 'officer-1' },
								{ examiningInspector2: 'officer-1' },
								{ examiningInspector3: 'officer-1' }
								//{ qaInspector1: 'officer-1-1' },
								//{ qaInspector2: 'officer-1' },
								//{ qaInspector3: 'officer-1' }
							]
						}
					}
				]
			},
			orderBy: { createdAt: 'desc' },
			skip: 0,
			take: 30
		});
		assert.deepEqual(ctx.res.render.mock.calls[0].arguments, [
			'views/assigned-to-me/assigned-to-me.njk',
			{
				backLinkUrl: '/',
				cases: [
					{
						id: 1,
						caseOfficer: 'officer-1',
						headerStatusText: 'Awaiting SLA',
						headerStatusClasses: 'govuk-tag--yellow'
					},
					{
						id: 2,
						caseOfficer: 'officer-2',
						headerStatusText: 'Awaiting SLA',
						headerStatusClasses: 'govuk-tag--yellow'
					}
				],
				caseOfficerText: 'Officer1',
				totalCases: 2,
				pagination: { previous: null, next: null, items: [] }
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
			{ id: 2, caseOfficer: 'officer-2', qaInspector1: 'Officer1' }
		];

		const ctx = createContext(cases);

		await ctx.handler(ctx.req, ctx.res);

		assert.equal(ctx.service.db.case.findMany.mock.callCount(), 1);

		assert.deepEqual(ctx.res.render.mock.calls[0].arguments[1], {
			backLinkUrl: '/',
			cases: [
				{
					id: 1,
					caseOfficer: 'officer-1',
					headerStatusText: 'Awaiting SLA',
					headerStatusClasses: 'govuk-tag--yellow'
				},
				{
					id: 2,
					caseOfficer: 'officer-2',
					headerStatusText: 'Awaiting SLA',
					headerStatusClasses: 'govuk-tag--yellow',
					qaInspector1: 'Officer1'
				}
			],
			caseOfficerText: 'Officer1',
			totalCases: 2,
			pagination: { previous: null, next: null, items: [] }
		});
	});

	it('fetches and renders the requested page of assigned cases', async () => {
		const ctx = createContext([{ id: 31, caseOfficer: 'officer-1' }], 31, '2');

		await ctx.handler(ctx.req, ctx.res);

		const where = ctx.service.db.case.findMany.mock.calls[0].arguments[0].where;
		assert.deepEqual(ctx.service.db.case.count.mock.calls[0].arguments[0], { where });
		assert.deepEqual(ctx.service.db.case.findMany.mock.calls[0].arguments[0], {
			where,
			orderBy: { createdAt: 'desc' },
			skip: 30,
			take: 30
		});

		const renderData = ctx.res.render.mock.calls[0].arguments[1];
		assert.equal(renderData.totalCases, 31);
		assert.deepEqual(renderData.pagination, {
			previous: { href: '/assigned-to-me?page=1' },
			next: null,
			items: [
				{ number: 1, href: '/assigned-to-me?page=1', current: false },
				{ number: 2, href: '/assigned-to-me?page=2', current: true }
			]
		});
	});

	it('does not check the current user when authentication is disabled', async () => {
		const ctx = createContext([], 0, undefined, true);
		ctx.req.session = {};

		await ctx.handler(ctx.req, ctx.res);

		assert.deepEqual(ctx.service.db.case.count.mock.calls[0].arguments[0], {
			where: { deletedDate: null }
		});
		assert.deepEqual(ctx.service.db.case.findMany.mock.calls[0].arguments[0], {
			where: { deletedDate: null },
			orderBy: { createdAt: 'desc' },
			skip: 0,
			take: 30
		});
		assert.equal(ctx.res.status.mock.callCount(), 0);
	});

	it('renders the Gateway 3 status for an assigned case', async () => {
		const ctx = createContext([{ id: 'case-1', caseOfficer: 'officer-1' }]);
		ctx.service.db.gateway3Info.findUnique.mock.mockImplementation(async () => ({
			submissions: [
				{
					id: 'submission-1',
					decision: null,
					completionDate: new Date('2026-10-01T12:00:00.000Z'),
					gateway3InfoId: 'gateway-3-info-1'
				}
			]
		}));
		ctx.service.db.document.findMany.mock.mockImplementation(
			async ({ where }: { where: { documentSetId: { in: string[] } } }) =>
				where.documentSetId.in.includes(DOCUMENT_SET_ID.G3_PROPOSED_LOCAL_PLAN)
					? [
							{
								createdAt: new Date('2026-09-30T12:00:00.000Z'),
								name: 'gateway-3-document.pdf',
								caseId: 'case-1',
								guid: 'document-1',
								documentSetId: DOCUMENT_SET_ID.G3_PROPOSED_LOCAL_PLAN,
								isDeleted: false,
								latestVersionId: null
							}
						]
					: []
		);

		await ctx.handler(ctx.req, ctx.res);

		const renderedCase = ctx.res.render.mock.calls[0].arguments[1].cases[0];
		assert.equal(renderedCase.headerStatusText, 'GW3 received');
		assert.equal(renderedCase.headerStatusClasses, 'govuk-tag--turquoise');
	});
});
