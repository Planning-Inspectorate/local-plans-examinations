import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import type { Request, Response } from 'express';
import type { ManageService } from '#service';
import { mockLogger } from '@pins/local-plans-lib/testing/mock-logger.ts';
import { updateCaseField, trimStringValues, buildGetJourneyMiddleware } from './controller.ts';

const JOURNEY_ID = 'edit-case-overview';

/** * Builds a mock ManageService with mocked Prisma delegates and a mock logger. */
function createMockService() {
	return {
		db: {
			case: {
				update: mock.fn(async () => ({})),
				findUnique: mock.fn(async () => null)
			},
			contact: {
				update: mock.fn(async () => ({})),
				delete: mock.fn(async () => ({}))
			}
		},
		logger: mockLogger()
	} as unknown as ManageService & {
		db: {
			case: { update: ReturnType<typeof mock.fn>; findUnique: ReturnType<typeof mock.fn> };
			contact: { update: ReturnType<typeof mock.fn>; delete: ReturnType<typeof mock.fn> };
		};
		logger: { error: ReturnType<typeof mock.fn> } & ManageService['logger'];
	};
}

/** * Builds a mock request with params, body and journey response locals. */
function createReq(overrides: {
	params?: Record<string, unknown>;
	body?: Record<string, unknown>;
	answers?: Record<string, unknown>;
}): { req: Request; res: Response; data: Record<string, any> } {
	const req = {
		params: { reference: 'PLAN/123456', ...(overrides.params ?? {}) },
		body: overrides.body ?? {}
	} as unknown as Request;

	const res = {
		locals: { journeyResponse: { answers: overrides.answers ?? {} } }
	} as unknown as Response;

	// The handler reads form values from `data.answers`
	const data = { answers: overrides.body ?? {} };

	return { req, res, data };
}

/**
 * Invokes a SaveDataFn with the minimal params the handler reads, while
 * satisfying the full SaveParams type required by the signature.
 */
function invokeSave(
	handler: ReturnType<typeof updateCaseField>,
	{ req, res, data }: { req: Request; res: Response; data: Record<string, any> }
) {
	return handler({
		req,
		res,
		data,
		journeyId: JOURNEY_ID,
		referenceId: '',
		isManageListItem: false
	} as Parameters<typeof handler>[0]);
}

describe('updateCaseField', () => {
	it('throws when the reference param is not a string', async () => {
		const service = createMockService();
		const handler = updateCaseField(service);
		const { req, res, data } = createReq({ params: { reference: undefined } });

		await assert.rejects(() => invokeSave(handler, { req, res, data }), /reference must be a string/);
	});

	describe('remove action', () => {
		it('deletes a contact when the section is contacts', async () => {
			const service = createMockService();
			const handler = updateCaseField(service);
			const { req, res, data } = createReq({
				params: { section: 'contacts', manageListAction: 'remove', manageListItemId: 'contact-1' }
			});

			await invokeSave(handler, { req, res, data });

			assert.equal(service.db.contact.delete.mock.callCount(), 1);
			assert.deepEqual(service.db.contact.delete.mock.calls[0].arguments[0], {
				where: { id: 'contact-1' }
			});
			assert.equal(service.db.case.update.mock.callCount(), 0);
		});

		it('disconnects an LPA from the case', async () => {
			const service = createMockService();
			const handler = updateCaseField(service);
			const { req, res, data } = createReq({
				params: { section: 'case-details', manageListAction: 'remove', manageListItemId: 'E60000001' }
			});

			await invokeSave(handler, { req, res, data });

			assert.equal(service.db.case.update.mock.callCount(), 1);
			assert.deepEqual(service.db.case.update.mock.calls[0].arguments[0], {
				where: { reference: 'PLAN/123456' },
				data: { lpas: { disconnect: { lpaCode: 'E60000001' } } }
			});
			assert.equal(service.db.contact.delete.mock.callCount(), 0);
		});

		it('uses the first id when manageListItemId is an array', async () => {
			const service = createMockService();
			const handler = updateCaseField(service);
			const { req, res, data } = createReq({
				params: {
					section: 'contacts',
					manageListAction: 'remove',
					manageListItemId: ['contact-1', 'ignored']
				}
			});

			await invokeSave(handler, { req, res, data });

			assert.deepEqual(service.db.contact.delete.mock.calls[0].arguments[0], {
				where: { id: 'contact-1' }
			});
		});
	});

	describe('edit contact action', () => {
		it('updates the contact and connects/creates its LPA', async () => {
			const service = createMockService();
			const handler = updateCaseField(service);
			const { req, res, data } = createReq({
				params: { section: 'contacts', manageListAction: 'edit', manageListItemId: 'contact-1' },
				body: {
					firstName: 'Jane',
					lastName: 'Smith',
					email: 'jane@lpa.gov.uk',
					phone: '01234567890',
					lpaContact: 'E60000001'
				}
			});

			await invokeSave(handler, { req, res, data });

			assert.equal(service.db.contact.update.mock.callCount(), 1);
			assert.deepEqual(service.db.contact.update.mock.calls[0].arguments[0], {
				where: { id: 'contact-1' },
				data: {
					firstName: 'Jane',
					lastName: 'Smith',
					email: 'jane@lpa.gov.uk',
					phoneNumber: '01234567890',
					lpa: {
						connectOrCreate: {
							where: { lpaCode: 'E60000001' },
							create: { lpaCode: 'E60000001' }
						}
					}
				}
			});
			assert.equal(service.db.case.update.mock.callCount(), 0);
		});

		it('prefers lpaCode over lpaContact for the contact LPA', async () => {
			const service = createMockService();
			const handler = updateCaseField(service);
			const { req, res, data } = createReq({
				params: { section: 'contacts', manageListAction: 'edit', manageListItemId: 'contact-1' },
				body: { firstName: 'Jane', lpaCode: 'E60000002', lpaContact: 'E60000001' }
			});

			await invokeSave(handler, { req, res, data });

			const updateData = (service.db.contact.update.mock.calls[0].arguments[0] as any).data;
			assert.deepEqual(updateData.lpa.connectOrCreate.where, { lpaCode: 'E60000002' });
		});
	});

	describe('case update (default action)', () => {
		it('updates scalar case fields', async () => {
			const service = createMockService();
			const handler = updateCaseField(service);
			const { req, res, data } = createReq({
				params: {},
				body: {
					planTitle: 'Southshire Local Plan',
					planType: 'Local Plan',
					caseOfficer: 'John Doe',
					programmeOfficer: 'Pat Officer',
					examinationWebsite: 'https://example.com',
					examiningInspector1: 'Insp One'
				}
			});

			await invokeSave(handler, { req, res, data });

			assert.equal(service.db.case.update.mock.callCount(), 1);
			const args = service.db.case.update.mock.calls[0].arguments[0] as any;
			assert.deepEqual(args.where, { reference: 'PLAN/123456' });
			assert.equal(args.data.planTitle, 'Southshire Local Plan');
			assert.equal(args.data.planType, 'Local Plan');
			assert.equal(args.data.caseOfficer, 'John Doe');
			assert.equal(args.data.programmeOfficer, 'Pat Officer');
			assert.equal(args.data.examiningInspector1, 'Insp One');
			// no contact or lpa fields -> undefined
			assert.equal(args.data.contacts, undefined);
			assert.equal(args.data.lpas, undefined);
		});

		it('creates a nested contact when contact fields are present', async () => {
			const service = createMockService();
			const handler = updateCaseField(service);
			const { req, res, data } = createReq({
				params: {},
				body: {
					firstName: 'Jane',
					lastName: 'Smith',
					email: 'jane@lpa.gov.uk',
					phone: '01234567890',
					lpaContact: 'E60000001'
				}
			});

			await invokeSave(handler, { req, res, data });

			const caseData = (service.db.case.update.mock.calls[0].arguments[0] as any).data;
			assert.deepEqual(caseData.contacts.create, {
				firstName: 'Jane',
				lastName: 'Smith',
				email: 'jane@lpa.gov.uk',
				phoneNumber: '01234567890',
				lpa: {
					connectOrCreate: {
						where: { lpaCode: 'E60000001' },
						create: { lpaCode: 'E60000001' }
					}
				}
			});
		});

		it('connects/creates and disconnects an LPA when lpa is provided', async () => {
			const service = createMockService();
			const handler = updateCaseField(service);
			const { req, res, data } = createReq({
				params: { manageListItemId: 'E60000000' },
				body: { lpa: 'E60000001' }
			});

			await invokeSave(handler, { req, res, data });

			const caseData = (service.db.case.update.mock.calls[0].arguments[0] as any).data;
			assert.deepEqual(caseData.lpas.connectOrCreate, {
				where: { lpaCode: 'E60000001' },
				create: { lpaCode: 'E60000001' }
			});
			assert.deepEqual(caseData.lpas.disconnect, [{ lpaCode: 'E60000000' }]);
		});

		it('trims whitespace from body fields before saving', async () => {
			const service = createMockService();
			const handler = updateCaseField(service);
			const { req, res, data } = createReq({
				params: {},
				body: { planTitle: '  Southshire Local Plan  ', caseOfficer: ' John Doe ' }
			});

			await invokeSave(handler, { req, res, data });

			const caseData = (service.db.case.update.mock.calls[0].arguments[0] as any).data;
			assert.equal(caseData.planTitle, 'Southshire Local Plan');
			assert.equal(caseData.caseOfficer, 'John Doe');
		});
	});
});

describe('processInputForDB', () => {
	it('trims all string values', () => {
		const input = {
			caseTitle: '  title  ',
			caseOfficer: '  officer  ',
			planType: '  plan type  '
		};
		assert.deepEqual(trimStringValues(input), {
			caseTitle: 'title',
			caseOfficer: 'officer',
			planType: 'plan type'
		});
	});

	it('returns a new object without mutating the input', () => {
		const input = { planTitle: '  x  ' };
		const output = trimStringValues(input);
		assert.notEqual(output, input);
		assert.equal(input.planTitle, '  x  ');
		assert.equal(output.planTitle, 'x');
	});

	it('leaves non-string values untouched', () => {
		const input = { planTitle: '  x  ', count: 3, flag: true, missing: undefined };
		assert.deepEqual(trimStringValues(input), {
			planTitle: 'x',
			count: 3,
			flag: true,
			missing: undefined
		});
	});
});

describe('buildGetJourneyMiddleware', () => {
	function createMiddlewareHarness(
		findUniqueImpl: () => Promise<unknown>,
		reference: string | string[] | undefined = 'PLAN/123456'
	) {
		const service = createMockService();
		service.db.case.findUnique.mock.mockImplementation(findUniqueImpl);

		const renderCalls: Array<[string, unknown?]> = [];
		const statusCalls: number[] = [];
		const res = {
			locals: {},
			render(view: string, model?: unknown) {
				renderCalls.push([view, model]);
				return this;
			},
			status(code: number) {
				statusCalls.push(code);
				return this;
			}
		} as unknown as Response;

		const req = {
			params: { reference },
			path: '/overview',
			url: '/overview',
			query: { section: 'overview' }
		} as unknown as Request;
		const next = mock.fn();

		return {
			service,
			handler: buildGetJourneyMiddleware(service, JOURNEY_ID),
			req,
			res,
			next,
			renderCalls,
			statusCalls
		};
	}

	it('populates journey locals and calls next when the case exists', async () => {
		const currentCase = {
			reference: 'PLAN/123456',
			planTitle: 'Southshire Local Plan',
			lpas: [{ lpaCode: 'E60000001' }, { lpaCode: 'E60000002' }],
			contacts: [
				{
					id: 'contact-1',
					firstName: 'Jane',
					lastName: 'Smith',
					email: 'jane@lpa.gov.uk',
					phoneNumber: '01234567890',
					lpaCode: 'E60000001'
				}
			]
		};
		const ctx = createMiddlewareHarness(async () => currentCase);

		await ctx.handler(ctx.req, ctx.res, ctx.next);

		assert.equal(ctx.service.db.case.findUnique.mock.callCount(), 1);
		assert.deepEqual(ctx.service.db.case.findUnique.mock.calls[0].arguments[0], {
			where: { reference: 'PLAN/123456' },
			include: {
				lpas: true,
				contacts: true,
				caseHistories: {
					orderBy: { date: 'desc' }
				}
			}
		});
		assert.equal(ctx.res.locals.planTitle, 'Southshire Local Plan');
		assert.equal(ctx.res.locals.reference, 'PLAN/123456');
		assert.deepEqual(ctx.res.locals.journeyResponse.answers.checkLpas, [
			{ id: 'E60000001', lpa: 'E60000001' },
			{ id: 'E60000002', lpa: 'E60000002' }
		]);
		assert.deepEqual(ctx.res.locals.journeyResponse.answers.contactDetails, [
			{
				id: 'contact-1',
				firstName: 'Jane',
				lastName: 'Smith',
				email: 'jane@lpa.gov.uk',
				phoneNumber: '01234567890',
				lpaCode: 'E60000001',
				phone: '01234567890',
				lpaContact: 'E60000001'
			}
		]);
		assert.equal(ctx.next.mock.callCount(), 1);
		assert.deepEqual(ctx.statusCalls, []);
	});

	it('decodes an encoded reference before fetching', async () => {
		const ctx = createMiddlewareHarness(
			async () => ({ reference: 'PLAN/123456', planTitle: 'x', lpas: [], contacts: [] }),
			'PLAN%2F123456'
		);

		await ctx.handler(ctx.req, ctx.res, ctx.next);

		assert.deepEqual((ctx.service.db.case.findUnique.mock.calls[0].arguments[0] as any).where, {
			reference: 'PLAN/123456'
		});
		assert.equal(ctx.next.mock.callCount(), 1);
	});

	it('uses the first reference when an array is provided', async () => {
		const ctx = createMiddlewareHarness(
			async () => ({ reference: 'PLAN/123456', planTitle: 'x', lpas: [], contacts: [] }),
			['PLAN%2F123456', 'IGNORED']
		);

		await ctx.handler(ctx.req, ctx.res, ctx.next);

		assert.deepEqual((ctx.service.db.case.findUnique.mock.calls[0].arguments[0] as any).where, {
			reference: 'PLAN/123456'
		});
	});

	it('renders 404 when the reference encoding is invalid and does not call next', async () => {
		const ctx = createMiddlewareHarness(async () => null, '%E0%A4%A');

		await ctx.handler(ctx.req, ctx.res, ctx.next);

		assert.equal(ctx.service.db.case.findUnique.mock.callCount(), 0);
		assert.deepEqual(ctx.statusCalls, [404]);
		assert.deepEqual(ctx.renderCalls, [['views/errors/404.njk', undefined]]);
		assert.equal(ctx.next.mock.callCount(), 0);
	});

	it('renders 404 when the case cannot be found and does not call next', async () => {
		const ctx = createMiddlewareHarness(async () => null);

		await ctx.handler(ctx.req, ctx.res, ctx.next);

		assert.equal(ctx.service.db.case.findUnique.mock.callCount(), 1);
		assert.deepEqual(ctx.statusCalls, [404]);
		assert.deepEqual(ctx.renderCalls, [['views/errors/404.njk', undefined]]);
		assert.equal(ctx.next.mock.callCount(), 0);
	});

	it('logs the error and still calls next when the fetch throws', async () => {
		const ctx = createMiddlewareHarness(async () => {
			throw new Error('db failed');
		});

		await ctx.handler(ctx.req, ctx.res, ctx.next);

		assert.equal(ctx.service.logger.error.mock.callCount(), 1);
		assert.match(ctx.service.logger.error.mock.calls[0].arguments[0] as string, /Unable to fetch case PLAN\/123456/);
		assert.equal(ctx.next.mock.callCount(), 1);
		assert.deepEqual(ctx.statusCalls, []);
	});
});
