import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import type { Request, Response } from 'express';
import {
	updateCaseField,
	trimStringValues,
	buildGetJourneyMiddleware,
	updateCaseHistory,
	getDeleteCase,
	postMarkAsDeleteCase
} from './controller.ts';

const REFERENCE = 'PLAN/123456';
const JOURNEY_ID = 'edit-case-overview';
const CASE_ID = '11111111-1111-1111-1111-111111111111';
const CURRENT_USER = 'Joe Bloggs';

function createService(): any {
	return {
		db: {
			case: {
				update: mock.fn(async () => ({})),
				findUnique: mock.fn(async () => ({
					id: CASE_ID
				}))
			},
			contact: {
				update: mock.fn(async () => ({})),
				delete: mock.fn(async () => ({})),
				upsert: mock.fn(async () => ({}))
			},
			gateway1Info: {
				upsert: mock.fn(async () => ({})),
				findUnique: mock.fn(async () => null)
			},
			gateway2Info: {
				upsert: mock.fn(async () => ({})),
				findUnique: mock.fn(async () => null)
			},
			gateway3Info: {
				upsert: mock.fn(async () => ({})),
				findUnique: mock.fn(async () => null)
			},
			examinationInfo: {
				upsert: mock.fn(async () => ({})),
				findUnique: mock.fn(async () => null)
			},
			documentSet: {
				upsert: mock.fn(async () => ({})),
				findMany: mock.fn(async () => [])
			},
			document: {
				upsert: mock.fn(async () => ({})),
				findMany: mock.fn(async () => [])
			}
		},
		logger: {
			info: mock.fn(),
			error: mock.fn()
		},
		getEntraClient: mock.fn(() => null)
	};
}

function createResponse(): any {
	const res: any = {
		locals: {}
	};

	res.status = mock.fn(() => res);
	res.render = mock.fn(() => res);

	return res;
}

function createSaveContext({
	url = '/overview',
	params = {},
	body = {}
}: {
	url?: string;
	params?: Record<string, unknown>;
	body?: Record<string, unknown>;
} = {}) {
	return {
		req: {
			url,
			params: {
				reference: REFERENCE,
				...params
			},
			body,
			session: {
				authEnabled: false
			}
		},
		res: createResponse(),
		data: {
			answers: body
		}
	};
}

async function save(handler: ReturnType<typeof updateCaseField>, context: ReturnType<typeof createSaveContext>) {
	await handler({
		req: context.req,
		res: context.res,
		data: context.data,
		journeyId: JOURNEY_ID,
		referenceId: '',
		isManageListItem: false
	} as any);
}

describe('updateCaseField', () => {
	it('removes a contact from the contacts section', async () => {
		const service = createService();
		const handler = updateCaseField(service);
		const context = createSaveContext({
			params: {
				section: 'contacts',
				manageListAction: 'remove',
				manageListItemId: 'contact-1'
			}
		});

		await save(handler, context);

		assert.equal(service.db.contact.delete.mock.callCount(), 1);
		assert.deepEqual(service.db.contact.delete.mock.calls[0].arguments[0], {
			where: {
				id: 'contact-1'
			}
		});

		assert.equal(service.db.case.update.mock.callCount(), 0);
	});

	it('disconnects an LPA when removing from a non-contact section', async () => {
		const service = createService();
		const handler = updateCaseField(service);
		const context = createSaveContext({
			params: {
				section: 'case-details',
				manageListAction: 'remove',
				manageListItemId: 'E60000001'
			}
		});

		await save(handler, context);

		assert.equal(service.db.case.update.mock.callCount(), 1);
		assert.deepEqual(service.db.case.update.mock.calls[0].arguments[0], {
			where: {
				reference: REFERENCE
			},
			data: {
				lpas: {
					disconnect: {
						lpaCode: 'E60000001'
					}
				}
			}
		});

		assert.equal(service.db.contact.delete.mock.callCount(), 0);
	});

	it('updates a contact when editing an existing contact row', async () => {
		const service = createService();
		const handler = updateCaseField(service);
		const context = createSaveContext({
			params: {
				section: 'contacts',
				manageListAction: 'edit',
				manageListItemId: 'contact-1'
			},
			body: {
				firstName: 'Jane',
				lastName: 'Smith',
				email: 'jane@example.com',
				phone: '01234567890',
				lpaContact: 'E60000001'
			}
		});

		await save(handler, context);

		assert.equal(service.db.contact.update.mock.callCount(), 1);
		assert.deepEqual(service.db.contact.update.mock.calls[0].arguments[0], {
			where: {
				id: 'contact-1'
			},
			data: {
				firstName: 'Jane',
				lastName: 'Smith',
				email: 'jane@example.com',
				phoneNumber: '01234567890',
				lpa: {
					connectOrCreate: {
						where: {
							lpaCode: 'E60000001'
						},
						create: {
							lpaCode: 'E60000001'
						}
					}
				}
			}
		});
	});

	it('prefers lpaCode over lpaContact when saving contact LPA data', async () => {
		const service = createService();
		const handler = updateCaseField(service);
		const context = createSaveContext({
			params: {
				section: 'contacts',
				manageListAction: 'edit',
				manageListItemId: 'contact-1'
			},
			body: {
				firstName: 'Jane',
				lpaCode: 'E60000002',
				lpaContact: 'E60000001'
			}
		});

		await save(handler, context);

		const update = service.db.contact.update.mock.calls[0].arguments[0];

		assert.deepEqual(update.data.lpa.connectOrCreate, {
			where: {
				lpaCode: 'E60000002'
			},
			create: {
				lpaCode: 'E60000002'
			}
		});
	});

	describe('case update (default action)', () => {
		it('updates scalar case fields', async () => {
			const service = createService();
			const handler = updateCaseField(service);
			const context = createSaveContext({
				url: '/overview',
				body: {
					planTitle: '  Southshire Local Plan  ',
					planType: 'Local Plan',
					caseOfficer: '  John Doe  ',
					programmeOfficerFirstName: 'Pat',
					programmeOfficerLastName: 'Officer',
					programmeOfficerEmail: 'pat.officer@example.com',
					examinationWebsite: 'https://example.com',
					examiningInspector1: 'Insp One',
					qaInspector1: 'Insp One'
				}
			});

			await save(handler, context);

			assert.equal(service.db.case.update.mock.callCount(), 2);
			const args = service.db.case.update.mock.calls[0].arguments[0] as any;
			assert.deepEqual(args.where, { reference: 'PLAN/123456' });
			assert.equal(args.data.planTitle, 'Southshire Local Plan');
			assert.equal(args.data.planType, 'Local Plan');
			assert.equal(args.data.caseOfficer, 'John Doe');
			assert.equal(args.data.programmeOfficerFirstName, 'Pat');
			assert.equal(args.data.programmeOfficerLastName, 'Officer');
			assert.equal(args.data.programmeOfficerEmail, 'pat.officer@example.com');
			assert.equal(args.data.examiningInspector1, 'Insp One');
			assert.equal(args.data.qaInspector1, 'Insp One');
			// no contact or lpa fields -> undefined
			assert.equal(args.data.contacts, undefined);
			assert.equal(args.data.lpas, undefined);
		});
	});

	it('upserts contact details on the check-contact-details overview question', async () => {
		const service = createService();
		const handler = updateCaseField(service);
		const context = createSaveContext({
			url: '/overview',
			params: {
				question: 'check-contact-details',
				manageListItemId: 'contact-1'
			},
			body: {
				firstName: 'Jane',
				lastName: 'Smith',
				email: 'jane@example.com',
				phone: '01234567890',
				lpaContact: 'E60000001'
			}
		});

		await save(handler, context);

		assert.equal(service.db.contact.upsert.mock.callCount(), 1);
		assert.deepEqual(service.db.contact.upsert.mock.calls[0].arguments[0], {
			where: {
				id: 'contact-1'
			},
			create: {
				firstName: 'Jane',
				lastName: 'Smith',
				email: 'jane@example.com',
				phoneNumber: '01234567890',
				lpa: {
					connectOrCreate: {
						where: {
							lpaCode: 'E60000001'
						},
						create: {
							lpaCode: 'E60000001'
						}
					}
				},
				cases: {
					connect: {
						reference: REFERENCE
					}
				}
			},
			update: {
				firstName: 'Jane',
				lastName: 'Smith',
				email: 'jane@example.com',
				phoneNumber: '01234567890',
				lpa: {
					connectOrCreate: {
						where: {
							lpaCode: 'E60000001'
						},
						create: {
							lpaCode: 'E60000001'
						}
					}
				}
			}
		});
	});

	it('upserts programme officer details from the overview programme-officer question', async () => {
		const service = createService();
		const handler = updateCaseField(service);
		const context = createSaveContext({
			url: '/overview',
			params: {
				question: 'programme-officer'
			},
			body: {
				programmeOfficerFirstName: 'Pat',
				programmeOfficerLastName: 'Officer',
				programmeOfficerEmail: 'pat.officer@example.com'
			}
		});

		await save(handler, context);

		assert.equal(service.db.gateway3Info.upsert.mock.callCount(), 1);
		assert.deepEqual(service.db.gateway3Info.upsert.mock.calls[0].arguments[0], {
			where: {
				caseId: CASE_ID
			},
			update: {
				programmeOfficerFirstName: 'Pat',
				programmeOfficerLastName: 'Officer',
				programmeOfficerEmail: 'pat.officer@example.com'
			},
			create: {
				caseId: CASE_ID,
				programmeOfficerFirstName: 'Pat',
				programmeOfficerLastName: 'Officer',
				programmeOfficerEmail: 'pat.officer@example.com'
			}
		});
	});

	it('does not upsert contact details when the current item id is empty', async () => {
		const service = createService();
		const handler = updateCaseField(service);
		const context = createSaveContext({
			url: '/overview',
			params: {
				question: 'check-contact-details',
				manageListItemId: ''
			},
			body: {
				firstName: 'Jane'
			}
		});

		await save(handler, context);

		assert.equal(service.db.contact.upsert.mock.callCount(), 0);
		assert.equal(service.db.case.update.mock.callCount(), 0);
	});

	it('upserts gateway 1 data', async () => {
		const service = createService();
		const handler = updateCaseField(service);
		const date = new Date('2026-01-01T00:00:00.000Z');
		const context = createSaveContext({
			url: '/gateway-1',
			body: {
				noticeOfIntention: date,
				dsaChecked: '  yes  '
			}
		});

		await save(handler, context);

		assert.equal(service.db.gateway1Info.upsert.mock.callCount(), 1);
		assert.deepEqual(service.db.gateway1Info.upsert.mock.calls[0].arguments[0], {
			where: {
				caseId: CASE_ID
			},
			update: {
				noticeOfIntention: date,
				dsaChecked: 'yes'
			},
			create: {
				caseId: CASE_ID,
				noticeOfIntention: date,
				dsaChecked: 'yes'
			}
		});
	});

	it('upserts gateway 2 data and sets appointment date for the assessor question', async () => {
		const service = createService();
		const handler = updateCaseField(service);
		const context = createSaveContext({
			url: '/gateway-2',
			params: {
				question: 'assessor-gateway-2'
			},
			body: {
				assessorName: '  Alex Assessor  '
			}
		});

		await save(handler, context);

		assert.equal(service.db.gateway2Info.upsert.mock.callCount(), 1);

		const upsert = service.db.gateway2Info.upsert.mock.calls[0].arguments[0];

		assert.equal(upsert.where.caseId, CASE_ID);
		assert.equal(upsert.update.assessorName, 'Alex Assessor');
		assert.equal(upsert.create.assessorName, 'Alex Assessor');
		assert.ok(upsert.update.assessorAppointmentDate instanceof Date);
		assert.ok(upsert.create.assessorAppointmentDate instanceof Date);
	});

	it('upserts gateway 3 data and sets appointment date for the assessor question', async () => {
		const service = createService();
		const handler = updateCaseField(service);
		const context = createSaveContext({
			url: '/gateway-3',
			params: {
				question: 'assessor-gateway-3'
			},
			body: {
				assessorName: '  Alex Assessor  '
			}
		});

		await save(handler, context);
		assert.equal(service.db.gateway3Info.upsert.mock.callCount(), 1);

		const upsert = service.db.gateway3Info.upsert.mock.calls[0].arguments[0];

		assert.equal(upsert.where.caseId, CASE_ID);
		assert.equal(upsert.update.assessorName, 'Alex Assessor');
		assert.equal(upsert.create.caseId, CASE_ID);
		assert.equal(upsert.create.assessorName, 'Alex Assessor');
		assert.ok(upsert.update.assessorAppointmentDate instanceof Date);
		assert.ok(upsert.create.assessorAppointmentDate instanceof Date);
	});

	it('upserts examination letter date data', async () => {
		const service = createService();
		const handler = updateCaseField(service);
		const letterSentToMHCLGDate = new Date('2026-12-15T00:00:00.000Z');
		const letterIssueDate = new Date('2026-12-16T00:00:00.000Z');
		const context = createSaveContext({
			url: '/examination',
			body: {
				letterSentToMHCLGDate,
				letterIssueDate
			}
		});

		await save(handler, context);

		assert.equal(service.db.examinationInfo.upsert.mock.callCount(), 1);
		assert.deepEqual(service.db.examinationInfo.upsert.mock.calls[0].arguments[0], {
			where: {
				caseId: CASE_ID
			},
			update: {
				letterSentToMHCLGDate,
				letterIssueDate
			},
			create: {
				caseId: CASE_ID,
				letterSentToMHCLGDate,
				letterIssueDate
			}
		});
	});

	it('upserts examination Fact Check date data', async () => {
		const service = createService();
		const handler = updateCaseField(service);
		const factCheckDateReceivedFromInspector = new Date('2026-01-06T12:00:00.000Z');
		const factCheckDueDate = new Date('2026-01-07T12:00:00.000Z');
		const factCheckActualDate = new Date('2026-01-08T12:00:00.000Z');
		const factCheckReceivedBackFromLPADate = new Date('2026-01-09T12:00:00.000Z');
		const finalReportIssueDate = new Date('2026-01-10T12:00:00.000Z');
		const context = createSaveContext({
			url: '/examination',
			body: {
				factCheckDateReceivedFromInspector,
				factCheckDueDate,
				factCheckActualDate,
				factCheckReceivedBackFromLPADate,
				finalReportIssueDate
			}
		});

		await save(handler, context);

		assert.equal(service.db.examinationInfo.upsert.mock.callCount(), 1);
		assert.deepEqual(service.db.examinationInfo.upsert.mock.calls[0].arguments[0], {
			where: {
				caseId: CASE_ID
			},
			update: {
				factCheckDateReceivedFromInspector,
				factCheckDueDate,
				factCheckActualDate,
				factCheckReceivedBackFromLPADate,
				finalReportIssueDate
			},
			create: {
				caseId: CASE_ID,
				factCheckDateReceivedFromInspector,
				factCheckDueDate,
				factCheckActualDate,
				factCheckReceivedBackFromLPADate,
				finalReportIssueDate
			}
		});
	});

	it('renders 404 when saving an unknown case page', async () => {
		const service = createService();
		const handler = updateCaseField(service);
		const context = createSaveContext({
			url: '/unknown-page'
		});

		await save(handler, context);

		assert.equal(service.logger.info.mock.callCount(), 1);
		assert.match(service.logger.info.mock.calls[0].arguments[0], /unknown-page/);

		assert.equal(context.res.status.mock.callCount(), 1);
		assert.equal(context.res.status.mock.calls[0].arguments[0], 404);

		assert.equal(context.res.render.mock.callCount(), 1);
		assert.equal(context.res.render.mock.calls[0].arguments[0], 'views/errors/404.njk');
	});
});

describe('updateCaseHistory', () => {
	const service = createService();
	const context = createSaveContext({
		url: '/case'
	});
	it('uses readable copy for Examination letter date updates', async () => {
		const db = {
			case: {
				update: mock.fn(async () => ({}))
			}
		};

		await updateCaseHistory(
			service,
			context.req,
			db as any,
			{
				letterSentToMHCLGDate: null,
				letterIssueDate: null
			},
			{
				letterSentToMHCLGDate: new Date('2026-10-03T23:00:00.000Z'),
				letterIssueDate: new Date('2026-10-04T23:00:00.000Z')
			},
			REFERENCE,
			CURRENT_USER
		);

		const entries = db.case.update.mock.calls[0].arguments[0].data.caseHistories.create;

		assert.equal(entries[0].event, 'Letter sent to MHCLG date updated to 4 October 2026');
		assert.equal(entries[1].event, 'Letter issue date updated to 5 October 2026');
	});

	it('uses readable copy for Fact Check date updates', async () => {
		const service = createService();

		await updateCaseHistory(
			service,
			context.req,
			service.db,
			{
				factCheckDateReceivedFromInspector: null,
				factCheckDueDate: null,
				factCheckActualDate: null,
				factCheckReceivedBackFromLPADate: null,
				finalReportIssueDate: null
			},
			{
				factCheckDateReceivedFromInspector: new Date('2026-01-06T12:00:00.000Z'),
				factCheckDueDate: new Date('2026-01-07T12:00:00.000Z'),
				factCheckActualDate: new Date('2026-01-08T12:00:00.000Z'),
				factCheckReceivedBackFromLPADate: new Date('2026-01-09T12:00:00.000Z'),
				finalReportIssueDate: new Date('2026-01-10T12:00:00.000Z')
			},
			REFERENCE,
			CURRENT_USER
		);

		const entries = service.db.case.update.mock.calls[0].arguments[0].data.caseHistories.create;

		assert.equal(entries[0].event, 'Fact Check date received from Inspector updated to 6 January 2026');
		assert.equal(entries[1].event, 'Fact Check due date updated to 7 January 2026');
		assert.equal(entries[2].event, 'Fact Check actual date updated to 8 January 2026');
		assert.equal(entries[3].event, 'Fact Check received back from LPA updated to 9 January 2026');
		assert.equal(entries[4].event, 'Final report issue date updated to 10 January 2026');
	});

	it('uses readable copy for Important Dates updates', async () => {
		const service = createService();

		await updateCaseHistory(
			service,
			context.req,
			service.db,
			{
				planPauseStartDate: null,
				planPauseEndDate: null,
				withdrawnDate: null,
				isSound: null,
				soundUnsoundDate: null,
				adoptionDate: null,
				approvedForCILDate: null
			},
			{
				planPauseStartDate: new Date('2026-01-06T12:00:00.000Z'),
				planPauseEndDate: new Date('2026-01-07T12:00:00.000Z'),
				withdrawnDate: new Date('2026-01-08T12:00:00.000Z'),
				isSound: false,
				soundUnsoundDate: new Date('2026-01-09T12:00:00.000Z'),
				adoptionDate: new Date('2026-01-10T12:00:00.000Z'),
				approvedForCILDate: new Date('2026-01-11T12:00:00.000Z')
			},
			REFERENCE,
			CURRENT_USER
		);

		const entries = service.db.case.update.mock.calls[0].arguments[0].data.caseHistories.create;

		assert.equal(entries[0].event, 'Plan pause date updated to 6 January 2026');
		assert.equal(entries[1].event, 'Plan pause end date updated to 7 January 2026');
		assert.equal(entries[2].event, 'Withdrawn date updated to 8 January 2026');
		assert.equal(entries[3].event, 'Sound / unsound updated to Unsound');
		assert.equal(entries[4].event, 'Sound / unsound date updated to 9 January 2026');
		assert.equal(entries[5].event, 'Adoption date updated to 10 January 2026');
		assert.equal(entries[6].event, 'Approved for CIL date updated to 11 January 2026');
	});
});

describe('trimStringValues', () => {
	it('trims string values', () => {
		assert.deepEqual(
			trimStringValues({
				planTitle: '  Southshire Local Plan  ',
				caseOfficer: '  John Doe  '
			}),
			{
				planTitle: 'Southshire Local Plan',
				caseOfficer: 'John Doe'
			}
		);
	});

	it('does not mutate the input object', () => {
		const input = {
			planTitle: '  Southshire Local Plan  '
		};

		const output = trimStringValues(input);

		assert.notEqual(output, input);
		assert.equal(input.planTitle, '  Southshire Local Plan  ');
		assert.equal(output.planTitle, 'Southshire Local Plan');
	});

	it('leaves non-string values unchanged', () => {
		const date = new Date('2026-01-01T00:00:00.000Z');

		assert.deepEqual(
			trimStringValues({
				name: '  value  ',
				count: 1,
				enabled: true,
				date,
				missing: undefined
			}),
			{
				name: 'value',
				count: 1,
				enabled: true,
				date,
				missing: undefined
			}
		);
	});
});

describe('buildGetJourneyMiddleware', () => {
	function createMiddlewareContext({
		url = '/overview',
		reference = REFERENCE
	}: {
		url?: string;
		reference?: unknown;
	} = {}) {
		const service = createService();
		const req = {
			url,
			params: {
				reference
			},
			session: {
				fileUploader: null
			}
		};
		const res = createResponse();
		const next = mock.fn();

		return {
			service,
			req,
			res,
			next,
			handler: buildGetJourneyMiddleware(service, JOURNEY_ID)
		};
	}

	it('renders 404 when the case title cannot be found', async () => {
		const ctx = createMiddlewareContext();

		ctx.service.db.case.findUnique.mock.mockImplementation(async () => null);

		await ctx.handler(ctx.req, ctx.res, ctx.next);

		assert.equal(ctx.service.db.case.findUnique.mock.callCount(), 1);
		assert.deepEqual(ctx.service.db.case.findUnique.mock.calls[0].arguments[0], {
			where: {
				reference: REFERENCE
			},
			select: {
				id: true,
				planTitle: true
			}
		});

		assert.equal(ctx.res.status.mock.callCount(), 1);
		assert.equal(ctx.res.status.mock.calls[0].arguments[0], 404);

		assert.equal(ctx.res.render.mock.callCount(), 1);
		assert.equal(ctx.res.render.mock.calls[0].arguments[0], 'views/errors/404.njk');

		assert.equal(ctx.next.mock.callCount(), 0);
	});

	it('loads overview journey data and maps list answers', async () => {
		const ctx = createMiddlewareContext({
			url: '/overview'
		});

		const overviewData = {
			reference: REFERENCE,
			planTitle: 'Southshire Local Plan',
			planType: 'Local Plan',
			gateway2Info: {
				assessorName: 'Alex Assessor'
			},
			lpas: [
				{
					lpaCode: 'E60000001'
				},
				{
					lpaCode: 'E60000002'
				}
			],
			contacts: [
				{
					id: 'contact-1',
					firstName: 'Jane',
					lastName: 'Smith',
					email: 'jane@example.com',
					phoneNumber: '01234567890',
					lpaCode: 'E60000001'
				}
			],
			examinationInfo: [
				{
					examiningInspector1: 'Inspector Goole',
					examiningInspector2: 'Inspector gadget',
					examiningInspector3: null,
					examinationWebsite: 'some website',
					qaInspector1: 'Inspector Goole',
					qaInspector2: 'Inspector Goolish',
					qaInspector3: 'Inspector Goolishish'
				}
			]
		};

		let caseFindCount = 0;
		ctx.service.db.case.findUnique.mock.mockImplementation(async () => {
			caseFindCount += 1;
			return caseFindCount === 1 ? { id: CASE_ID, planTitle: 'Southshire Local Plan' } : overviewData;
		});

		await ctx.handler(ctx.req, ctx.res, ctx.next);

		assert.equal(ctx.service.db.case.findUnique.mock.callCount(), 2);

		assert.deepEqual(ctx.service.db.case.findUnique.mock.calls[0].arguments[0], {
			where: { reference: 'PLAN/123456' },
			select: { id: true, planTitle: true }
		});

		assert.deepEqual(ctx.service.db.case.findUnique.mock.calls[1].arguments[0], {
			where: {
				reference: REFERENCE
			},
			include: {
				caseHistories: {
					orderBy: {
						date: 'desc'
					}
				},
				lpas: true,
				contacts: true,
				gateway2Info: {
					select: {
						assessorName: true
					}
				},
				gateway3Info: {
					select: {
						programmeOfficerFirstName: true,
						programmeOfficerLastName: true,
						programmeOfficerEmail: true,
						assessorName: true
					}
				},
				examinationInfo: {
					select: {
						examiningInspector1: true,
						examiningInspector2: true,
						examiningInspector3: true,
						examinationWebsite: true,
						qaInspector1: true,
						qaInspector2: true,
						qaInspector3: true
					}
				}
			}
		});

		assert.equal(ctx.res.locals.planTitle, 'Southshire Local Plan');
		assert.equal(ctx.res.locals.reference, REFERENCE);
		assert.equal(ctx.res.locals.journeyResponse.answers.assessorName, 'Alex Assessor');

		assert.deepEqual(ctx.res.locals.journeyResponse.answers.checkLpas, [
			{
				id: 'E60000001',
				lpa: 'E60000001'
			},
			{
				id: 'E60000002',
				lpa: 'E60000002'
			}
		]);

		assert.deepEqual(ctx.res.locals.journeyResponse.answers.contactDetails, [
			{
				id: 'contact-1',
				firstName: 'Jane',
				lastName: 'Smith',
				email: 'jane@example.com',
				phoneNumber: '01234567890',
				lpaCode: 'E60000001',
				phone: '01234567890',
				lpaContact: 'E60000001'
			}
		]);

		assert.deepEqual(ctx.res.locals.journeyResponse.answers.examinationInfo, [
			{
				examiningInspector1: 'Inspector Goole',
				examiningInspector2: 'Inspector gadget',
				examiningInspector3: null,
				examinationWebsite: 'some website',
				qaInspector1: 'Inspector Goole',
				qaInspector2: 'Inspector Goolish',
				qaInspector3: 'Inspector Goolishish'
			}
		]);

		assert.equal(ctx.next.mock.callCount(), 1);
	});

	it('renders 404 when overview data cannot be found', async () => {
		const ctx = createMiddlewareContext({
			url: '/overview'
		});

		let caseFindCount = 0;
		ctx.service.db.case.findUnique.mock.mockImplementation(async () => {
			caseFindCount += 1;
			return caseFindCount === 1 ? { planTitle: 'Southshire Local Plan' } : null;
		});

		await ctx.handler(ctx.req, ctx.res, ctx.next);

		assert.equal(ctx.service.db.case.findUnique.mock.callCount(), 2);

		assert.equal(ctx.res.status.mock.callCount(), 1);
		assert.equal(ctx.res.status.mock.calls[0].arguments[0], 404);

		assert.equal(ctx.res.render.mock.callCount(), 1);
		assert.equal(ctx.res.render.mock.calls[0].arguments[0], 'views/errors/404.njk');

		assert.equal(ctx.next.mock.callCount(), 0);
	});

	it('loads gateway 1 journey data', async () => {
		const ctx = createMiddlewareContext({
			url: '/gateway-1'
		});

		ctx.service.db.case.findUnique.mock.mockImplementation(async () => ({
			id: CASE_ID,
			planTitle: 'Southshire Local Plan'
		}));

		ctx.service.db.gateway1Info.findUnique.mock.mockImplementation(async () => ({
			caseId: CASE_ID,
			dsaChecked: 'yes'
		}));

		ctx.service.db.documentSet.findMany.mock.mockImplementation(async () => [
			{
				id: '1',
				folderName: 'gateway-2-workshop-document'
			},
			{
				id: '2',
				folderName: 'signed-sla'
			}
		]);
		ctx.service.db.document.findMany.mock.mockImplementation(async () => []);

		await ctx.handler(ctx.req, ctx.res, ctx.next);

		assert.deepEqual(ctx.service.db.gateway1Info.findUnique.mock.calls[0].arguments[0], {
			where: {
				caseId: CASE_ID
			}
		});

		assert.equal(ctx.res.locals.planTitle, 'Southshire Local Plan');
		assert.equal(ctx.res.locals.reference, REFERENCE);
		assert.equal(ctx.res.locals.journeyResponse.answers.dsaChecked, 'yes');
		assert.equal(ctx.next.mock.callCount(), 1);
	});

	it('loads gateway 2 journey data', async () => {
		const ctx = createMiddlewareContext({
			url: '/gateway-2'
		});

		ctx.service.db.case.findUnique.mock.mockImplementation(async () => ({
			id: CASE_ID,
			reference: 'some reference',
			planTitle: 'Southshire Local Plan'
		}));

		ctx.service.db.gateway2Info.findUnique.mock.mockImplementation(async () => ({
			caseId: CASE_ID,
			assessorName: 'Alex Assessor'
		}));

		ctx.service.db.documentSet.findMany.mock.mockImplementation(async () => [
			{
				id: '1',
				folderName: 'gateway-2-workshop-document'
			},
			{
				id: '2',
				folderName: 'signed-sla'
			}
		]);
		ctx.service.db.document.findMany.mock.mockImplementation(async () => []);

		await ctx.handler(ctx.req, ctx.res, ctx.next);

		assert.deepEqual(ctx.service.db.gateway2Info.findUnique.mock.calls[0].arguments[0], {
			where: {
				caseId: CASE_ID
			}
		});

		assert.equal(ctx.res.locals.planTitle, 'Southshire Local Plan');
		assert.equal(ctx.res.locals.reference, REFERENCE);
		assert.equal(ctx.res.locals.journeyResponse.answers.assessorName, 'Alex Assessor');
		assert.equal(ctx.next.mock.callCount(), 1);
	});

	it('loads gateway 3 journey data', async () => {
		const ctx = createMiddlewareContext({
			url: '/gateway-3'
		});

		ctx.service.db.case.findUnique.mock.mockImplementation(async () => ({
			id: CASE_ID,
			planTitle: 'Southshire Local Plan'
		}));

		ctx.service.db.gateway3Info.findUnique.mock.mockImplementation(async () => ({
			caseId: CASE_ID,
			assessorName: 'Alex Assessor'
		}));

		await ctx.handler(ctx.req, ctx.res, ctx.next);

		assert.deepEqual(ctx.service.db.gateway3Info.findUnique.mock.calls[0].arguments[0], {
			where: {
				caseId: CASE_ID
			}
		});

		assert.equal(ctx.res.locals.planTitle, 'Southshire Local Plan');
		assert.equal(ctx.res.locals.reference, REFERENCE);
		assert.equal(ctx.res.locals.journeyResponse.answers.assessorName, 'Alex Assessor');
		assert.equal(ctx.next.mock.callCount(), 1);
	});

	it('loads examination journey data', async () => {
		const ctx = createMiddlewareContext({
			url: '/examination'
		});
		const letterSentToMHCLGDate = new Date('2026-10-01T12:00:00.000Z');
		const factCheckDueDate = new Date('2026-01-07T12:00:00.000Z');

		ctx.service.db.case.findUnique.mock.mockImplementation(async () => ({
			id: CASE_ID,
			planTitle: 'Southshire Local Plan'
		}));

		ctx.service.db.examinationInfo.findUnique.mock.mockImplementation(async () => ({
			caseId: CASE_ID,
			letterSentToMHCLGDate,
			factCheckDueDate
		}));

		await ctx.handler(ctx.req, ctx.res, ctx.next);

		assert.deepEqual(ctx.service.db.examinationInfo.findUnique.mock.calls[0].arguments[0], {
			where: {
				caseId: CASE_ID
			}
		});

		assert.equal(ctx.res.locals.planTitle, 'Southshire Local Plan');
		assert.equal(ctx.res.locals.reference, REFERENCE);
		assert.equal(ctx.res.locals.journeyResponse.answers.letterSentToMHCLGDate, letterSentToMHCLGDate);
		assert.equal(ctx.res.locals.journeyResponse.answers.factCheckDueDate, factCheckDueDate);
		assert.equal(ctx.next.mock.callCount(), 1);
	});

	it('logs unknown pages after loading the case title', async () => {
		const ctx = createMiddlewareContext({
			url: '/unknown-page'
		});

		ctx.service.db.case.findUnique.mock.mockImplementation(async () => ({
			id: CASE_ID,
			planTitle: 'Southshire Local Plan'
		}));

		await ctx.handler(ctx.req, ctx.res, ctx.next);

		assert.equal(ctx.service.logger.error.mock.callCount(), 1);
		assert.match(ctx.service.logger.error.mock.calls[0].arguments[0], /Unknown page unknown-page/);

		assert.equal(ctx.next.mock.callCount(), 0);
		assert.equal(ctx.res.status.mock.callCount(), 0);
		assert.equal(ctx.res.render.mock.callCount(), 0);
	});
});

describe('DeleteCase', () => {
	(it('renders delete-case.njk when getDeleteCase is called', async () => {
		const service = createService();
		const currentCase = {
			reference: 'PLAN/123456',
			planTitle: 'Southshire Local Plan',
			planType: 'Local Plan',
			lpas: [{ lpaCode: 'E60000001' }, { lpaCode: 'E60000002' }],
			caseOfficer: 'John Doe'
		};
		service.db.case.findUnique.mock.mockImplementation(async () => currentCase);
		const render = mock.fn();
		const status = mock.fn(() => ({ render }));
		const res = {
			locals: {},
			render,
			status
		} as unknown as Response;
		const req = { params: { reference: 'PLAN/123456' } } as unknown as Request;

		await getDeleteCase(service)(req, res);

		assert.equal(render.mock.calls[0].arguments[0], 'views/layouts/delete-case.njk');
	}),
		it('sets deletedDate when delete is confirmed', async () => {
			const service = createService();
			const currentCase = {
				reference: 'PLAN/123456',
				planTitle: 'Southshire Local Plan',
				planType: 'Local Plan',
				lpas: [{ lpaCode: 'E60000001' }, { lpaCode: 'E60000002' }],
				caseOfficer: 'John Doe'
			};
			service.db.case.findUnique.mock.mockImplementation(async () => currentCase);
			const redirect = mock.fn();
			const res = { redirect } as unknown as Response;
			const req = { params: { reference: 'PLAN/123456' } } as unknown as Request;

			await postMarkAsDeleteCase(service)(req, res);

			assert.equal(service.db.case.update.mock.callCount(), 1);

			const args = service.db.case.update.mock.calls[0].arguments[0] as any;

			assert.ok(args.data.deletedDate instanceof Date);
		}),
		it('redirects to all cases when delete is confirmed', async () => {
			const service = createService();
			const currentCase = {
				reference: 'PLAN/123456',
				planTitle: 'Southshire Local Plan',
				planType: 'Local Plan',
				lpas: [{ lpaCode: 'E60000001' }, { lpaCode: 'E60000002' }],
				caseOfficer: 'John Doe'
			};
			service.db.case.findUnique.mock.mockImplementation(async () => currentCase);
			const redirect = mock.fn();
			const res = { redirect } as unknown as Response;
			const req = { params: { reference: 'PLAN/123456' } } as unknown as Request;

			await postMarkAsDeleteCase(service)(req, res);

			assert.equal(redirect.mock.calls[0].arguments[0], '/');
		}));
});
