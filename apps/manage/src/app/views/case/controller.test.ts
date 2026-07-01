import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import type { Request, Response } from 'express';
import type { ManageService } from '#service';
import { mockLogger } from '@pins/local-plans-lib/testing/mock-logger.ts';
import { updateCaseField, processInputForDB, buildGetJourneyMiddleware } from './controller.ts';

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
	};
}

/** * Builds a mock request with params, body and journey response locals. */
function createReq(overrides: {
	params?: Record<string, unknown>;
	body?: Record<string, unknown>;
	answers?: Record<string, unknown>;
}): { req: Request; res: Response } {
	const req = {
		params: { reference: 'PLAN/123456', ...(overrides.params ?? {}) },
		body: overrides.body ?? {}
	} as unknown as Request;

	const res = {
		locals: { journeyResponse: { answers: overrides.answers ?? {} } }
	} as unknown as Response;

	return { req, res };
}

describe('updateCaseField', () => {
	it('throws when the reference param is not a string', async () => {
		const service = createMockService();
		const handler = updateCaseField(service);
		const { req, res } = createReq({ params: { reference: undefined } });

		await assert.rejects(() => handler({ req, res }), /reference must be a string/);
	});

	describe('remove action', () => {
		it('deletes a contact when the section is contacts', async () => {
			const service = createMockService();
			const handler = updateCaseField(service);
			const { req, res } = createReq({
				params: { section: 'contacts', manageListAction: 'remove', manageListItemId: 'contact-1' }
			});

			await handler({ req, res });

			assert.equal(service.db.contact.delete.mock.callCount(), 1);
			assert.deepEqual(service.db.contact.delete.mock.calls[0].arguments[0], {
				where: { id: 'contact-1' }
			});
			assert.equal(service.db.case.update.mock.callCount(), 0);
		});

		it('disconnects an LPA from the case', async () => {
			const service = createMockService();
			const handler = updateCaseField(service);
			const { req, res } = createReq({
				params: { section: 'case-details', manageListAction: 'remove', manageListItemId: 'E60000001' }
			});

			await handler({ req, res });

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
			const { req, res } = createReq({
				params: {
					section: 'contacts',
					manageListAction: 'remove',
					manageListItemId: ['contact-1', 'ignored']
				}
			});

			await handler({ req, res });

			assert.deepEqual(service.db.contact.delete.mock.calls[0].arguments[0], {
				where: { id: 'contact-1' }
			});
		});
	});

	describe('edit contact action', () => {
		it('updates the contact and connects/creates its LPA', async () => {
			const service = createMockService();
			const handler = updateCaseField(service);
			const { req, res } = createReq({
				params: { section: 'contacts', manageListAction: 'edit', manageListItemId: 'contact-1' },
				body: {
					firstName: 'Jane',
					lastName: 'Smith',
					email: 'jane@lpa.gov.uk',
					phone: '01234567890',
					lpaContact: 'E60000001'
				}
			});

			await handler({ req, res });

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
			const { req, res } = createReq({
				params: { section: 'contacts', manageListAction: 'edit', manageListItemId: 'contact-1' },
				body: { firstName: 'Jane', lpaCode: 'E60000002', lpaContact: 'E60000001' }
			});

			await handler({ req, res });

			const data = service.db.contact.update.mock.calls[0].arguments[0].data;
			assert.deepEqual(data.lpa.connectOrCreate.where, { lpaCode: 'E60000002' });
		});
	});

	describe('case update (default action)', () => {
		it('updates scalar case fields', async () => {
			const service = createMockService();
			const handler = updateCaseField(service);
			const { req, res } = createReq({
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

			await handler({ req, res });

			assert.equal(service.db.case.update.mock.callCount(), 1);
			const args = service.db.case.update.mock.calls[0].arguments[0];
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
			const { req, res } = createReq({
				params: {},
				body: {
					firstName: 'Jane',
					lastName: 'Smith',
					email: 'jane@lpa.gov.uk',
					phone: '01234567890',
					lpaContact: 'E60000001'
				}
			});

			await handler({ req, res });

			const data = service.db.case.update.mock.calls[0].arguments[0].data;
			assert.deepEqual(data.contacts.create, {
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
			const { req, res } = createReq({
				params: { manageListItemId: 'E60000000' },
				body: { lpa: 'E60000001' }
			});

			await handler({ req, res });

			const data = service.db.case.update.mock.calls[0].arguments[0].data;
			assert.deepEqual(data.lpas.connectOrCreate, {
				where: { lpaCode: 'E60000001' },
				create: { lpaCode: 'E60000001' }
			});
			assert.deepEqual(data.lpas.disconnect, [{ lpaCode: 'E60000000' }]);
		});

		it('trims whitespace from body fields before saving', async () => {
			const service = createMockService();
			const handler = updateCaseField(service);
			const { req, res } = createReq({
				params: {},
				body: { planTitle: '  Southshire Local Plan  ', caseOfficer: ' John Doe ' }
			});

			await handler({ req, res });

			const data = service.db.case.update.mock.calls[0].arguments[0].data;
			assert.equal(data.planTitle, 'Southshire Local Plan');
			assert.equal(data.caseOfficer, 'John Doe');
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
		assert.deepEqual(processInputForDB(input), {
			caseTitle: 'title',
			caseOfficer: 'officer',
			planType: 'plan type'
		});
	});

	it('returns a new object without mutating the input', () => {
		const input = { planTitle: '  x  ' };
		const output = processInputForDB(input);
		assert.notEqual(output, input);
		assert.equal(input.planTitle, '  x  ');
		assert.equal(output.planTitle, 'x');
	});

	it('leaves non-string values untouched', () => {
		const input = { planTitle: '  x  ', count: 3, flag: true, missing: undefined };
		assert.deepEqual(processInputForDB(input), {
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

		const req = { params: { reference } } as unknown as Request;
		const next = mock.fn();

		return {
			service,
			handler: buildGetJourneyMiddleware(service),
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
			include: { lpas: true, contacts: true }
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

		assert.deepEqual(ctx.service.db.case.findUnique.mock.calls[0].arguments[0].where, {
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

		assert.deepEqual(ctx.service.db.case.findUnique.mock.calls[0].arguments[0].where, {
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
		assert.match(ctx.service.logger.error.mock.calls[0].arguments[0], /Unable to fetch case PLAN\/123456/);
		assert.equal(ctx.next.mock.callCount(), 1);
		assert.deepEqual(ctx.statusCalls, []);
	});
});
