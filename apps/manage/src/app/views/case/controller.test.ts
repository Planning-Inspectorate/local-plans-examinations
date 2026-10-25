import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import type { Request, Response } from 'express';
import {
	updateCaseField,
	trimStringValues,
	buildGetJourneyMiddleware,
	updateCaseHistory,
	getDeleteCase,
	postMarkAsDeleteCase,
	downloadDocument,
	buildCheckReportMiddleware,
	preprocessQuestionProperties,
	issueGateway3Document,
	issueGateway2WorkshopDocuments,
	issueExaminationReport,
	fileUploaderCaseSessionKeyForField,
	redirectToFileUploaderQuestion,
	redirectToChecks,
	buildRemoveDocumentConfirmMiddleware
} from './controller.ts';
import { DocumentUtil } from '@pins/local-plans-lib/util/documents.ts';
import { OverviewTabHandler } from './overview-data-handlers/overview-tab-handler.ts';
import { Gateway1TabHandler } from './overview-data-handlers/gateway-1-tab-handler.ts';
import { Gateway2TabHandler } from './overview-data-handlers/gateway-2-tab-handler.ts';
import { Gateway3TabHandler } from './overview-data-handlers/gateway-3-tab-handler.ts';
import { ExaminationTabHandler } from './overview-data-handlers/examination-tab-handler.ts';
import type { OverviewPageLoadHandler } from './overview-data-handlers/overview-page-load-handler.ts';
import { addUploadedDocumentDetailsToAnswers } from './overview-data-handlers/overview-page-helper.ts';
import {
	EXAMINATION_STATUS_ID,
	GATEWAY_3_DECISION_ID
} from '@pins/local-plans-database/src/seed/static-data/ids/index.ts';

const REFERENCE = 'PLAN-123456';
const JOURNEY_ID = 'edit-case-overview';
const CASE_ID = '11111111-1111-1111-1111-111111111111';
const CURRENT_USER = 'Joe Bloggs';
const MOCK_DOCUMENT_SETS = [
	{ id: '1', folderName: 'covering-letter' },
	{ id: '2', folderName: 'local-plan-timetable' },
	{ id: '3', folderName: 'project-initiation-document' },
	{ id: '4', folderName: 'draft-stat-compliance' },
	{ id: '5', folderName: 'draft-stat-soundness' },
	{ id: '6', folderName: 'notice-of-intent' },
	{ id: '7', folderName: 'scoping-cons' },
	{ id: '8', folderName: 'cons-summ' },
	{ id: '9', folderName: 'g1-self-assess' },
	{ id: '10', folderName: 'cons-of-proposed' },
	{ id: '11', folderName: 'summary-of-consultation' },
	{ id: '12', folderName: 'subsequent-work-towards-a-draft-plan' },
	{ id: '13', folderName: 'gateway-2-report' },
	{ id: '14', folderName: 'signed-sla' },
	{ id: '15', folderName: 'gateway-3-document' },
	{ id: '16', folderName: 'gateway-3-document-1' },
	{ id: '17', folderName: 'gateway-2-workshop-documents' },
	{ id: '18', folderName: 'examination-report' }
];

function createService(): any {
	const db: any = {
		case: {
			update: mock.fn(async () => ({ id: CASE_ID })),
			findUnique: mock.fn(async () => ({
				id: CASE_ID,
				gateway2Info: {
					workshops: []
				},
				gateway3Info: {
					submissions: [
						{
							id: 'someId',
							decision: undefined,
							completionDate: undefined,
							gateway3InfoId: undefined
						}
					]
				},
				examinationInfo: {
					hearings: [],
					planPauseHistory: []
				}
			}))
		},
		caseHistory: {
			findFirst: mock.fn(async () => null)
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
			updateMany: mock.fn(async () => ({ count: 1 })),
			findUnique: mock.fn(async () => null),
			findFirst: mock.fn(async () => null)
		},
		documentSet: {
			upsert: mock.fn(async () => ({})),
			findMany: mock.fn(async () => [])
		},
		document: {
			upsert: mock.fn(async () => ({})),
			findMany: mock.fn(async () => [])
		},
		authority: {
			findMany: mock.fn(async () => [])
		},
		gateway3Submission: {
			findMany: mock.fn(async () => [])
		}
	};
	db.$transaction = mock.fn(async (fn: (tx: any) => Promise<unknown>) => fn(db));

	return {
		db,
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
	const req: any = {
		url,
		params: {
			reference: REFERENCE,
			...params
		},
		body,
		session: {
			authEnabled: false
		}
	};

	return {
		req: req as Request,
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
							lpaCode: 'E60000001',
							lpaName: ''
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
				lpaCode: 'E60000002',
				lpaName: ''
			}
		});
	});

	describe('case update (default action)', () => {
		it('updates overview fields by answer key across Case and related models', async () => {
			const service = createService();
			const handler = updateCaseField(service);
			const context = createSaveContext({
				url: '/overview',
				params: { question: 'an-unrelated-question-name' },
				body: {
					planTitle: '  Southshire Local Plan  ',
					planType: 'Local Plan',
					caseOfficer: '  John Doe  ',
					assessorGateway3: '  Legacy assessor field  ',
					assessorName: '  Alex Assessor  ',
					gateway3AssessorName: '  Alex Inspector  ',
					programmeOfficerFirstName: 'Pat',
					examinationWebsite: 'https://example.com',
					examiningInspector1: 'Insp One',
					qaInspector1: 'QA One'
				}
			});

			await save(handler, context);

			assert.equal(service.db.case.update.mock.callCount(), 2);
			const args = service.db.case.update.mock.calls[0].arguments[0] as any;
			assert.deepEqual(args.where, { reference: 'PLAN-123456' });
			assert.equal(args.data.planTitle, 'Southshire Local Plan');
			assert.equal(args.data.planType, 'Local Plan');
			assert.equal(args.data.caseOfficer, 'John Doe');
			assert.equal(args.data.assessorGateway3, 'Legacy assessor field');
			assert.deepEqual(args.data.gateway2Info.upsert.create.assessorName, 'Alex Assessor');
			assert.ok(args.data.gateway2Info.upsert.create.assessorAppointmentDate instanceof Date);
			assert.equal(args.data.gateway3Info.upsert.create.assessorName, 'Alex Inspector');
			assert.equal(args.data.gateway3Info.upsert.create.programmeOfficerFirstName, 'Pat');
			assert.equal(args.data.examinationInfo.upsert.create.examinationWebsite, 'https://example.com');
			assert.equal(args.data.examinationInfo.upsert.create.examiningInspector1, 'Insp One');
			assert.equal(args.data.examinationInfo.upsert.create.qaInspector1, 'QA One');
			assert.ok(args.data.examinationInfo.upsert.create.examiningInspectorAppointmentDate instanceof Date);
			assert.deepEqual(service.db.examinationInfo.updateMany.mock.calls[0].arguments[0], {
				where: {
					caseId: CASE_ID,
					status: EXAMINATION_STATUS_ID.SUBMITTED
				},
				data: { status: EXAMINATION_STATUS_ID.IN_EXAMINATION }
			});
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
							lpaCode: 'E60000001',
							lpaName: ''
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
							lpaCode: 'E60000001',
							lpaName: ''
						}
					}
				}
			}
		});
	});

	it('upserts programme officer details based on their answer keys', async () => {
		const service = createService();
		const handler = updateCaseField(service);
		const context = createSaveContext({
			url: '/overview',
			params: { question: 'not-the-programme-officer-question' },
			body: {
				programmeOfficerFirstName: 'Pat',
				programmeOfficerLastName: 'Officer',
				programmeOfficerEmail: 'pat.officer@example.com'
			}
		});

		await save(handler, context);

		assert.equal(service.db.case.update.mock.callCount(), 2);
		assert.deepEqual(service.db.case.update.mock.calls[0].arguments[0].data.gateway3Info, {
			upsert: {
				create: {
					programmeOfficerFirstName: 'Pat',
					programmeOfficerLastName: 'Officer',
					programmeOfficerEmail: 'pat.officer@example.com'
				},
				update: {
					programmeOfficerFirstName: 'Pat',
					programmeOfficerLastName: 'Officer',
					programmeOfficerEmail: 'pat.officer@example.com'
				}
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
		// Just mock the first call, which fetches the submission details
		service.db.case.findUnique.mock.mockImplementationOnce(
			async () => ({
				gateway3Info: {
					submissions: [
						{
							id: 'someId',
							decision: undefined,
							completionDate: undefined,
							gateway3InfoId: undefined
						}
					]
				}
			}),
			0
		);
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
				withdrawnDate: null,
				isSound: null,
				soundUnsoundDate: null,
				adoptionDate: null,
				approvedForCILDate: null
			},
			{
				withdrawnDate: new Date('2026-01-08T12:00:00.000Z'),
				isSound: 'unsound',
				soundUnsoundDate: new Date('2026-01-09T12:00:00.000Z'),
				adoptionDate: new Date('2026-01-10T12:00:00.000Z'),
				approvedForCILDate: new Date('2026-01-11T12:00:00.000Z')
			},
			REFERENCE,
			CURRENT_USER
		);

		const entries = service.db.case.update.mock.calls[0].arguments[0].data.caseHistories.create;

		assert.equal(entries[0].event, 'Withdrawn date updated to 8 January 2026');
		assert.equal(entries[1].event, 'Outcome updated to Unsound');
		assert.equal(entries[2].event, 'Report issued updated to 9 January 2026');
		assert.equal(entries[3].event, 'Adoption date updated to 10 January 2026');
		assert.equal(entries[4].event, 'Approved for CIL date updated to 11 January 2026');
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
		reference = REFERENCE,
		pageLoadHandler = OverviewTabHandler
	}: {
		url?: string;
		reference?: unknown;
		pageLoadHandler?: new () => OverviewPageLoadHandler;
	} = {}) {
		const service = createService();
		service.db.documentSet.findMany.mock.mockImplementation(async () => MOCK_DOCUMENT_SETS);
		const req: any = {
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
			handler: buildGetJourneyMiddleware(service, JOURNEY_ID, pageLoadHandler)
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
		const noteCreatedDate = new Date();

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
			],
			notes: [
				{
					text: 'some note',
					createdTime: noteCreatedDate,
					createdBy: 'Some person'
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
			where: { reference: 'PLAN-123456' },
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
				},
				notes: true
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
		assert.deepEqual(ctx.res.locals.journeyResponse.answers.notes, [
			{
				text: 'some note',
				createdTime: noteCreatedDate,
				createdBy: 'Some person'
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
			url: '/gateway-1',
			pageLoadHandler: Gateway1TabHandler
		});

		ctx.service.db.case.findUnique.mock.mockImplementation(async () => ({
			id: CASE_ID,
			planTitle: 'Southshire Local Plan'
		}));

		ctx.service.db.gateway1Info.findUnique.mock.mockImplementation(async () => ({
			caseId: CASE_ID,
			dsaChecked: 'yes'
		}));

		ctx.service.db.documentSet.findMany.mock.mockImplementation(async () => MOCK_DOCUMENT_SETS);
		ctx.service.db.document.findMany.mock.mockImplementation(async () => MOCK_DOCUMENT_SETS);

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
			url: '/gateway-2',
			pageLoadHandler: Gateway2TabHandler
		});

		ctx.service.db.case.findUnique.mock.mockImplementation(async () => ({
			id: CASE_ID,
			reference: 'some reference',
			planTitle: 'Southshire Local Plan'
		}));

		ctx.service.db.gateway2Info.findUnique.mock.mockImplementation(async () => ({
			caseId: CASE_ID,
			assessorName: 'Alex Assessor',
			workshops: []
		}));

		ctx.service.db.documentSet.findMany.mock.mockImplementation(async () => MOCK_DOCUMENT_SETS);
		ctx.service.db.document.findMany.mock.mockImplementation(async () => MOCK_DOCUMENT_SETS);

		await ctx.handler(ctx.req, ctx.res, ctx.next);

		assert.deepEqual(ctx.service.db.gateway2Info.findUnique.mock.calls[0].arguments[0], {
			include: {
				workshops: true
			},
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
			url: '/gateway-3',
			pageLoadHandler: Gateway3TabHandler
		});

		ctx.service.db.case.findUnique.mock.mockImplementation(async () => ({
			id: CASE_ID,
			planTitle: 'Southshire Local Plan'
		}));

		ctx.service.db.gateway3Info.findUnique.mock.mockImplementation(async () => ({
			caseId: CASE_ID,
			assessorName: 'Alex Assessor',
			submissions: [
				{
					id: 'someId',
					decision: undefined,
					completionDate: undefined,
					gateway3InfoId: undefined
				}
			]
		}));
		ctx.service.db.documentSet.findMany.mock.mockImplementation(async () => MOCK_DOCUMENT_SETS);

		await ctx.handler(ctx.req, ctx.res, ctx.next);

		assert.deepEqual(ctx.service.db.gateway3Info.findUnique.mock.calls[0].arguments[0], {
			where: {
				caseId: CASE_ID
			},
			include: { submissions: true }
		});

		assert.equal(ctx.res.locals.planTitle, 'Southshire Local Plan');
		assert.equal(ctx.res.locals.reference, REFERENCE);
		assert.equal(ctx.res.locals.journeyResponse.answers.assessorName, 'Alex Assessor');
		assert.equal(ctx.next.mock.callCount(), 1);
	});

	it('continues the Gateway 3 document page when no files have been uploaded', async () => {
		const ctx = createMiddlewareContext({
			url: '/gateway-3/gateway-3-submission/gateway-3-document',
			pageLoadHandler: Gateway3TabHandler
		});

		Object.assign(ctx.req, {
			method: 'POST',
			params: {
				reference: REFERENCE,
				section: 'gateway-3-submission-1',
				question: 'gateway-3-document-1'
			},
			originalUrl: `/case/${REFERENCE}/gateway-3/gateway-3-submission/gateway-3-document`
		});

		ctx.service.db.case.findUnique.mock.mockImplementation(async () => ({
			id: CASE_ID,
			planTitle: 'Southshire Local Plan'
		}));
		ctx.service.db.gateway3Info.findUnique.mock.mockImplementation(async () => ({
			caseId: CASE_ID,
			submissions: [
				{
					id: 'someId',
					decision: undefined,
					completionDate: undefined,
					gateway3InfoId: undefined
				}
			]
		}));
		ctx.service.db.documentSet.findMany.mock.mockImplementation(async () => MOCK_DOCUMENT_SETS);

		await ctx.handler(ctx.req, ctx.res, ctx.next);

		assert.equal(ctx.next.mock.callCount(), 1);
	});

	it('loads examination journey data', async () => {
		const ctx = createMiddlewareContext({
			url: '/examination',
			pageLoadHandler: ExaminationTabHandler
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
			},
			include: {
				planPauseHistory: true,
				hearings: true
			}
		});

		assert.equal(ctx.res.locals.planTitle, 'Southshire Local Plan');
		assert.equal(ctx.res.locals.reference, REFERENCE);
		assert.equal(ctx.res.locals.journeyResponse.answers.letterSentToMHCLGDate, letterSentToMHCLGDate);
		assert.equal(ctx.res.locals.journeyResponse.answers.factCheckDueDate, factCheckDueDate);
		assert.equal(ctx.next.mock.callCount(), 1);
	});

	it('marks Manage-page uploads as returning to Manage after confirmation', async () => {
		const ctx = createMiddlewareContext({
			url: '/examination/outcome/examination-report-manage',
			pageLoadHandler: ExaminationTabHandler
		});
		Object.assign(ctx.req, {
			method: 'GET',
			params: {
				reference: REFERENCE,
				section: 'outcome',
				question: 'examination-report-manage'
			}
		});
		ctx.service.db.case.findUnique.mock.mockImplementation(async () => ({
			id: CASE_ID,
			planTitle: 'Southshire Local Plan'
		}));
		ctx.service.db.examinationInfo.findUnique.mock.mockImplementation(async () => ({
			caseId: CASE_ID,
			soundUnsoundDate: new Date('2026-01-01T12:00:00.000Z')
		}));
		ctx.service.db.document.findMany.mock.mockImplementation(async () => [
			{
				guid: 'report-guid',
				name: 'report.pdf',
				documentSetId: '18',
				isDeleted: false,
				latestDocumentVersion: {
					originalFilename: 'report.pdf',
					fileName: 'report.pdf',
					isDeleted: false,
					mime: 'application/pdf',
					size: 100,
					version: 1,
					dateCreated: new Date('2026-01-01T12:00:00.000Z')
				}
			}
		]);

		await ctx.handler(ctx.req, ctx.res, ctx.next);

		assert.equal((ctx.req.session as any).examinationReportReturnToManage, true);
	});

	it('retains saved reports when reopening the uploader from Examination CYA or Manage', async () => {
		const ctx = createMiddlewareContext({
			url: '/examination/outcome/examination-report?returnTo=check',
			pageLoadHandler: ExaminationTabHandler
		});
		Object.assign(ctx.req, {
			method: 'GET',
			query: { returnTo: 'check' },
			params: { reference: REFERENCE, section: 'outcome', question: 'examination-report' }
		});
		ctx.service.db.examinationInfo.findUnique.mock.mockImplementation(async () => ({ isSound: 'sound' }));
		ctx.service.db.document.findMany.mock.mockImplementation(async ({ where }: any) => {
			if (where.documentSetId !== '18') return [];
			const name = where.isTemp === false ? 'saved-report.pdf' : 'temporary-report.pdf';
			return [{ guid: name, name, documentSetId: '18', latestDocumentVersion: { fileName: name, version: 1 } }];
		});

		await ctx.handler(ctx.req, ctx.res, ctx.next);

		const files = ctx.req.session.fileUploader?.[`${REFERENCE}:examinationReport`]?.uploadedFiles;
		assert.deepEqual(
			files?.map((file) => file.fileName),
			['saved-report.pdf', 'temporary-report.pdf']
		);
		assert.deepEqual(ctx.res.locals.journeyResponse.answers.examinationReport, files);

		ctx.req.query = {};
		ctx.req.url = '/examination/outcome/examination-report';
		await ctx.handler(ctx.req, ctx.res, ctx.next);
		assert.deepEqual(
			ctx.res.locals.journeyResponse.answers.examinationReport.map((file: any) => file.fileName),
			['saved-report.pdf', 'temporary-report.pdf']
		);
	});

	it('clears the Manage return marker when there are no uploaded report files', async () => {
		const ctx = createMiddlewareContext({
			url: '/examination/outcome/examination-report-manage',
			pageLoadHandler: ExaminationTabHandler
		});
		Object.assign(ctx.req, {
			method: 'GET',
			params: {
				reference: REFERENCE,
				section: 'outcome',
				question: 'examination-report-manage'
			}
		});
		(ctx.req.session as any).examinationReportReturnToManage = true;
		ctx.service.db.case.findUnique.mock.mockImplementation(async () => ({
			id: CASE_ID,
			planTitle: 'Southshire Local Plan'
		}));
		ctx.service.db.examinationInfo.findUnique.mock.mockImplementation(async () => ({
			caseId: CASE_ID,
			soundUnsoundDate: null
		}));

		await ctx.handler(ctx.req, ctx.res, ctx.next);

		assert.equal((ctx.req.session as any).examinationReportReturnToManage, undefined);
	});
});

describe('Examination report removal', () => {
	for (const { method, action, body } of [
		{ method: 'GET', action: 'remove', body: {} },
		{ method: 'POST', action: 'delete-document', body: { returnToManage: 'true' } }
	]) {
		it(`loads saved reports for ${method} ${action}`, async (t) => {
			const service = createService();
			service.db.documentSet.findMany.mock.mockImplementation(async () => MOCK_DOCUMENT_SETS);
			const file = {
				id: 'examination/case-id/examination-report/report.pdf',
				fileName: 'report.pdf',
				mimeType: 'application/pdf',
				size: 100,
				storageProvider: 'blob' as const
			};
			t.mock.method(DocumentUtil, 'loadUploadedDocuments', async () => [file]);
			const loadTemporary = t.mock.method(DocumentUtil, 'loadTempUploadedDocuments', async () => []);
			const req = {
				method,
				url: `/examination/outcome/examination-report/${action}/${encodeURIComponent(file.id)}`,
				params: { reference: REFERENCE, section: 'outcome', question: 'examination-report', fileId: file.id },
				body,
				query: {},
				session: {}
			} as unknown as Request;
			const answers: Record<string, unknown> = {};

			await addUploadedDocumentDetailsToAnswers(service, { id: CASE_ID }, req, answers, 'examination');

			assert.deepEqual(req.session.fileUploader?.[`${REFERENCE}:examinationReport`]?.uploadedFiles, [file]);
			assert.equal(loadTemporary.mock.callCount(), 0);
			if (method === 'GET') {
				const res = { render: mock.fn(), status: mock.fn() } as unknown as Response;
				await buildRemoveDocumentConfirmMiddleware('examination')(req, res, mock.fn());
				assert.deepEqual((res.render as any).mock.calls[0].arguments, [
					'views/layouts/remove-uploaded-document',
					{
						caseReference: REFERENCE,
						fileName: file.fileName,
						formAction: `/case/${REFERENCE}/examination/outcome/examination-report/delete-document/${encodeURIComponent(file.id)}`,
						backLink: `/case/${REFERENCE}/examination/outcome/examination-report-manage`
					}
				]);
			}
		});
	}
});

describe('Gateway 3 document loading', () => {
	for (const { name, question, completionDate, check, temporary } of [
		{
			name: 'loads drafts in an editable uploader',
			question: 'gateway-3-document-1',
			completionDate: null,
			check: false,
			temporary: true
		},
		{
			name: 'loads saved files in an issued report View',
			question: 'gateway-3-document-1',
			completionDate: new Date('2026-10-01'),
			check: false,
			temporary: false
		},
		{
			name: 'keeps the next submission editable after an earlier report is issued',
			question: 'gateway-3-document-2',
			completionDate: new Date('2026-10-01'),
			check: false,
			temporary: true
		},
		{
			name: 'loads saved files on check answers before the report is issued',
			question: 'gateway-3-document-1',
			completionDate: null,
			check: true,
			temporary: false
		}
	]) {
		it(name, async (t) => {
			const service = createService();
			service.db.documentSet.findMany.mock.mockImplementation(async () => [
				...MOCK_DOCUMENT_SETS,
				{ id: '18', folderName: 'gateway-3-document-2' }
			]);
			const savedFile = {
				id: 'saved-file',
				fileName: 'issued.pdf',
				mimeType: 'application/pdf',
				size: 100,
				storageProvider: 'blob' as const
			};
			const draftFile = { ...savedFile, id: 'draft-file', fileName: 'draft.pdf' };
			t.mock.method(DocumentUtil, 'loadUploadedDocuments', async () => [savedFile]);
			t.mock.method(DocumentUtil, 'loadTempUploadedDocuments', async () => [draftFile]);
			const req = {
				params: { reference: REFERENCE, question },
				url: `/gateway-3-report/gateway-3-submission-1/${question}${check ? '/check' : ''}`,
				session: {}
			} as unknown as Request;
			const submissions = [{ id: 'submission-1', decision: '1', completionDate, gateway3InfoId: CASE_ID }];
			if (question.endsWith('-2')) {
				submissions.unshift({ id: 'submission-2', decision: '2', completionDate: null, gateway3InfoId: CASE_ID });
			}
			const answers: Record<string, any> = { submissions };

			await addUploadedDocumentDetailsToAnswers(service, { id: CASE_ID }, req, answers, 'gateway-3-report');

			const fieldName = question.replace('gateway-3-document-', 'gateway3Documents-');
			assert.deepEqual(answers[fieldName], [temporary ? draftFile : savedFile]);
			assert.deepEqual(req.session.fileUploader?.[`${REFERENCE}:${fieldName}`].uploadedFiles, answers[fieldName]);
		});
	}
});

describe('DeleteCase', () => {
	(it('renders delete-case.njk when getDeleteCase is called', async () => {
		const service = createService();
		const currentCase = {
			reference: 'PLAN-123456',
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
		const req = { params: { reference: 'PLAN-123456' } } as unknown as Request;

		await getDeleteCase(service)(req, res);

		assert.equal(render.mock.calls[0].arguments[0], 'views/layouts/delete-case.njk');
	}),
		it('sets deletedDate when delete is confirmed', async () => {
			const service = createService();
			const currentCase = {
				reference: 'PLAN-123456',
				planTitle: 'Southshire Local Plan',
				planType: 'Local Plan',
				lpas: [{ lpaCode: 'E60000001' }, { lpaCode: 'E60000002' }],
				caseOfficer: 'John Doe'
			};
			service.db.case.findUnique.mock.mockImplementation(async () => currentCase);
			const redirect = mock.fn();
			const res = { redirect } as unknown as Response;
			const req = { params: { reference: 'PLAN-123456' } } as unknown as Request;

			await postMarkAsDeleteCase(service)(req, res);

			assert.equal(service.db.case.update.mock.callCount(), 1);

			const args = service.db.case.update.mock.calls[0].arguments[0] as any;

			assert.ok(args.data.deletedDate instanceof Date);
		}),
		it('redirects to all cases when delete is confirmed', async () => {
			const service = createService();
			const currentCase = {
				reference: 'PLAN-123456',
				planTitle: 'Southshire Local Plan',
				planType: 'Local Plan',
				lpas: [{ lpaCode: 'E60000001' }, { lpaCode: 'E60000002' }],
				caseOfficer: 'John Doe'
			};
			service.db.case.findUnique.mock.mockImplementation(async () => currentCase);
			const redirect = mock.fn();
			const res = { redirect } as unknown as Response;
			const req = { params: { reference: 'PLAN-123456' } } as unknown as Request;

			await postMarkAsDeleteCase(service)(req, res);

			assert.equal(redirect.mock.calls[0].arguments[0], '/');
		}));
});

describe('downloadDocument', () => {
	it('downloads a document to a response object', async () => {
		const service = createService();
		const mockDownload = mock.method(DocumentUtil, 'downloadDocumentToResponse', async () => {});
		const req = {
			params: {
				documentId: 'some-document'
			}
		};
		const res = {};
		await downloadDocument(service)(req as unknown as Request, res as Response);
		assert.deepEqual(mockDownload.mock.calls[0].arguments, [service, 'some-document', res]);
	});
	it('rejects when the documentId is not found in the request', async () => {
		const service = createService();
		const mockDownload = mock.method(DocumentUtil, 'downloadDocumentToResponse', async () => {});
		const req = {
			params: {}
		};
		const res = {};
		assert.rejects(async () => {
			await downloadDocument(service)(req as unknown as Request, res as Response);
		}, /Missing a documentId from the download-case-document endpoint/);
	});
});

describe('fileUploaderCaseSessionKeyForField', () => {
	it('scopes uploaded files to the case reference', () => {
		const firstCase = { params: { reference: 'PLAN-111111' } } as unknown as Request;
		const secondCase = { params: { reference: 'PLAN-222222' } } as unknown as Request;

		assert.equal(fileUploaderCaseSessionKeyForField(firstCase, 'gateway2Report'), 'PLAN-111111:gateway2Report');
		assert.equal(fileUploaderCaseSessionKeyForField(secondCase, 'gateway2Report'), 'PLAN-222222:gateway2Report');
	});
});

describe('redirectToFileUploaderQuestion', () => {
	const request = (body: Record<string, unknown> = {}) =>
		({
			baseUrl: `/case/${REFERENCE}`,
			url: '/examination/outcome/examination-report/delete-document/file-1',
			params: {
				section: 'outcome',
				question: 'examination-report',
				fileId: 'file-1'
			},
			body
		}) as unknown as Request;

	it('stays on the uploader when removing a file from the upload question', () => {
		assert.equal(
			redirectToFileUploaderQuestion(request()),
			`/case/${REFERENCE}/examination/outcome/examination-report`
		);
	});

	it('returns to Manage after confirming removal from the Manage page', () => {
		assert.equal(
			redirectToFileUploaderQuestion(request({ returnToManage: 'true' })),
			`/case/${REFERENCE}/examination/outcome/examination-report-manage`
		);
	});

	it('preserves the check-page return after uploading or removing a report', () => {
		for (const fileId of [undefined, 'file-1']) {
			const req = request();
			req.params.fileId = fileId;
			req.query = { returnTo: 'check' };

			assert.equal(
				redirectToFileUploaderQuestion(req),
				`/case/${REFERENCE}/examination/outcome/examination-report?returnTo=check`
			);
		}
	});
});

describe('redirectToChecks', () => {
	for (const uploadedFiles of [[], [{ id: 'report-1' }]]) {
		it(`preserves the check-page return when continuing with ${uploadedFiles.length} reports`, () => {
			const req = {
				params: { reference: REFERENCE, section: 'outcome', question: 'examination-report' },
				url: '/examination/outcome/examination-report/upload-documents/submit?returnTo=check',
				query: { returnTo: 'check' },
				session: { fileUploader: { examinationReport: { uploadedFiles } } }
			} as unknown as Request;

			assert.equal(
				redirectToChecks(req, 'examination', { fieldName: 'examinationReport' } as any),
				`/case/${REFERENCE}/examination/outcome/examination-report${uploadedFiles.length ? '/check' : ''}?returnTo=check`
			);
		});
	}
});

describe('issueExaminationReport', () => {
	it('finishes the initial report journey after its date is changed', async () => {
		const service = createService();
		service.db.examinationInfo.findUnique.mock.mockImplementation(async () => ({
			soundUnsoundDate: new Date('2026-10-19')
		}));
		const req = {
			params: { reference: REFERENCE },
			query: { returnTo: 'check' },
			session: { authEnabled: false }
		} as unknown as Request;
		const redirect = mock.fn();

		await issueExaminationReport(service, 'examination')(req, { redirect } as unknown as Response, mock.fn());

		assert.equal(redirect.mock.calls[0].arguments[0], `/case/${REFERENCE}/examination`);
		const expectedMessage = {
			type: 'success',
			text: 'Final report and supporting documents saved and notification sent',
			html: undefined
		};
		assert.deepEqual(req.session.alerts[0], expectedMessage);
	});

	it('refreshes the report date on resubmission when no manual date edit exists', async () => {
		const service = createService();
		const beforeConfirm = new Date();
		service.db.examinationInfo.findUnique.mock.mockImplementation(async () => ({
			soundUnsoundDate: new Date('2026-01-01T12:00:00.000Z')
		}));
		const req = {
			params: { reference: REFERENCE },
			query: { returnTo: 'check' },
			session: { authEnabled: false, examinationReportReturnToManage: true }
		} as unknown as Request;
		const redirect = mock.fn();
		const res = { redirect } as unknown as Response;

		await issueExaminationReport(service, 'examination')(req, res, mock.fn());

		assert.equal(
			redirect.mock.calls[0].arguments[0],
			`/case/${REFERENCE}/examination/outcome/examination-report-manage`
		);
		const savedDate = service.db.examinationInfo.upsert.mock.calls[0].arguments[0].update.soundUnsoundDate;
		assert.ok(savedDate instanceof Date);
		assert.ok(savedDate.getTime() >= beforeConfirm.getTime());
		assert.equal((req.session as any).examinationReportReturnToManage, undefined);
	});

	it('preserves a manually entered date on resubmission', async () => {
		const service = createService();
		const manuallyEnteredDate = new Date('2026-01-01T12:00:00.000Z');
		service.db.examinationInfo.findUnique.mock.mockImplementation(async () => ({
			soundUnsoundDate: manuallyEnteredDate
		}));
		service.db.caseHistory.findFirst.mock.mockImplementation(async () => ({ id: 'manual-date-history' }));
		const req = {
			params: { reference: REFERENCE },
			query: { returnTo: 'check' },
			session: { authEnabled: false, examinationReportReturnToManage: true }
		} as unknown as Request;
		const redirect = mock.fn();
		const res = { redirect } as unknown as Response;

		await issueExaminationReport(service, 'examination')(req, res, mock.fn());

		assert.equal(service.db.examinationInfo.upsert.mock.callCount(), 0);
		assert.equal(
			redirect.mock.calls[0].arguments[0],
			`/case/${REFERENCE}/examination/outcome/examination-report-manage`
		);
	});
});

describe('buildCheckReportMiddleware', () => {
	const service = createService();
	const caseId = 'some-case-id';
	const caseReference = 'some-case-reference';
	const journeyId = 'some-journey-id';
	service.db.case.findUnique.mock.mockImplementation(async () => ({
		caseId: caseId
	}));
	const dateCreated = new Date(2026, 0, 1);
	it('can handle signed-sla for gateway 1 with an sla that has not been submitted yet', async () => {
		const res = {
			render: mock.fn(() => {})
		};
		const req = {
			session: {
				fileUploader: {
					[`${caseReference}:signedSla`]: {
						uploadedFiles: [
							{
								dateCreated: new Date(2025, 0, 1)
							}
						]
					}
				}
			},
			params: {
				reference: caseReference,
				planReference: caseReference,
				question: 'signed-sla',
				section: 'gateway-1'
			},
			originalUrl: 'url-to-redirect-do/some-postfix'
		};
		service.db.gateway1Info.findUnique.mock.mockImplementation(async () => ({
			slaSentDate: null,
			slaReceivedDate: dateCreated
		}));
		await buildCheckReportMiddleware(service, journeyId)(req as unknown as Request, res as unknown as Response);
		const expected_call_args = [
			'views/layouts/submit-documents-check-your-answers',
			{
				additionalFields: [
					{
						name: 'Date uploaded',
						url: 'sla-received-date',
						value: '1 January 2026'
					}
				],
				backLink: 'url-to-redirect-do',
				caseReference: 'some-case-reference',
				journeyId: 'some-journey-id',
				notificationTextLPA: undefined,
				notificationPreviewTemplate: 'signed-sla',
				question: 'signed-sla',
				section: 'gateway-1',
				submitButtonText: 'Confirm and issue notification',
				titleHeading: 'Check signed SLA and issue notification',
				uploadedFiles: [
					{
						dateCreated: new Date(2025, 0, 1)
					}
				]
			}
		];
		assert.deepEqual(res.render.mock.calls[0].arguments, expected_call_args);
	});
	it('can handle signed-sla for gateway 1 with sla that has already been submitted', async () => {
		const res = {
			render: mock.fn(() => {})
		};
		const req = {
			session: {
				fileUploader: {
					[`${caseReference}:signedSla`]: {
						uploadedFiles: [
							{
								dateCreated: new Date(2025, 0, 1)
							}
						]
					}
				}
			},
			params: {
				reference: caseReference,
				planReference: caseReference,
				question: 'signed-sla',
				section: 'gateway-1'
			},
			originalUrl: 'url-to-redirect-do/some-postfix'
		};
		service.db.gateway1Info.findUnique.mock.mockImplementation(async () => ({
			slaSentDate: new Date(),
			slaReceivedDate: dateCreated
		}));
		await buildCheckReportMiddleware(service, journeyId)(req as unknown as Request, res as unknown as Response);
		const expected_call_args = [
			'views/layouts/submit-documents-check-your-answers',
			{
				additionalFields: [
					{
						name: 'Date uploaded',
						url: 'sla-received-date',
						value: '1 January 2026'
					}
				],
				backLink: 'url-to-redirect-do',
				caseReference: 'some-case-reference',
				journeyId: 'some-journey-id',
				notificationPreviewTemplate: 'signed-sla-complete',
				notificationTextLPA: undefined,
				question: 'signed-sla',
				section: 'gateway-1',
				submitButtonText: 'Confirm and issue notification',
				titleHeading: 'Check signed SLA and issue notification',
				uploadedFiles: [
					{
						dateCreated: new Date(2025, 0, 1)
					}
				]
			}
		];
		assert.deepEqual(res.render.mock.calls[0].arguments, expected_call_args);
	});
	it('can handle gateway-2-report for gateway 2 with a report that has not been submitted yet', async () => {
		const res = {
			render: mock.fn(() => {})
		};
		const req = {
			session: {
				fileUploader: {
					[`${caseReference}:gateway2Report`]: {
						uploadedFiles: [
							{
								dateCreated: dateCreated
							}
						]
					}
				}
			},
			params: {
				reference: caseReference,
				planReference: caseReference,
				question: 'gateway-2-report',
				section: 'gateway-2'
			},
			originalUrl: 'url-to-redirect-do/some-postfix'
		};
		service.db.gateway2Info.findUnique.mock.mockImplementation(async () => ({
			reportIssuedDate: null
		}));
		await buildCheckReportMiddleware(service, journeyId)(req as unknown as Request, res as unknown as Response);
		const expected_call_args = [
			'views/layouts/submit-documents-check-your-answers',
			{
				additionalFields: [
					{
						name: 'Date uploaded',
						url: undefined,
						value: '1 January 2026'
					}
				],
				backLink: 'url-to-redirect-do',
				caseReference: 'some-case-reference',
				journeyId: 'some-journey-id',
				notificationPreviewTemplate: 'gateway-2-report',
				notificationTextLPA: "We'll send a notification to the LPA to tell them that the report is available",
				question: 'gateway-2-report',
				section: 'gateway-2',
				submitButtonText: 'Issue report',
				titleHeading: 'Check Gateway 2 report details and issue notification',
				uploadedFiles: [
					{
						dateCreated: dateCreated
					}
				]
			}
		];
		assert.deepEqual(res.render.mock.calls[0].arguments, expected_call_args);
	});
	it('can handle gateway-2-report for gateway 2 with a report that has already been submitted', async () => {
		const res = {
			render: mock.fn(() => {})
		};
		const req = {
			session: {
				fileUploader: {
					[`${caseReference}:gateway2Report`]: {
						uploadedFiles: [
							{
								dateCreated: dateCreated
							}
						]
					}
				}
			},
			params: {
				reference: caseReference,
				planReference: caseReference,
				question: 'gateway-2-report',
				section: 'gateway-2'
			},
			originalUrl: 'url-to-redirect-do/some-postfix'
		};
		service.db.gateway2Info.findUnique.mock.mockImplementation(async () => ({
			reportIssuedDate: new Date()
		}));
		await buildCheckReportMiddleware(service, journeyId)(req as unknown as Request, res as unknown as Response);
		const expected_call_args = [
			'views/layouts/submit-documents-check-your-answers',
			{
				additionalFields: [
					{
						name: 'Date uploaded',
						url: undefined,
						value: '1 January 2026'
					}
				],
				backLink: 'url-to-redirect-do',
				caseReference: 'some-case-reference',
				journeyId: 'some-journey-id',
				notificationPreviewTemplate: 'gateway-2-report-complete',
				notificationTextLPA: "We'll send a notification to the LPA to tell them that the report is available",
				question: 'gateway-2-report',
				section: 'gateway-2',
				submitButtonText: 'Issue report',
				titleHeading: 'Check Gateway 2 report details and issue notification',
				uploadedFiles: [
					{
						dateCreated: dateCreated
					}
				]
			}
		];
		assert.deepEqual(res.render.mock.calls[0].arguments, expected_call_args);
	});
	it('rejects when there is an unexpected question', async () => {
		const res = {
			render: mock.fn(() => {})
		};
		const req = {
			session: {},
			params: {
				reference: caseReference,
				planReference: caseReference,
				question: 'some-brand-new-question',
				section: 'some-new-section'
			},
			originalUrl: 'url-to-redirect-do/some-postfix'
		};
		assert.rejects(async () => {
			await buildCheckReportMiddleware(service, journeyId)(req as unknown as Request, res as unknown as Response);
		}, /Could not find question config for question url/);
	});
});

describe('preprocessQuestionProperties', () => {
	const caseReference = 'some-case-reference';
	const journeyId = 'gateway-3';
	it('removes the completed workshop document link for an incomplete Gateway 2 case', async () => {
		const service = createService();
		service.db.case.findUnique.mock.mockImplementation(async () => ({
			gateway2Info: {
				workshopDocumentUploadedDate: null
			}
		}));
		const req = {
			session: {},
			params: { reference: 'PLAN-222222' }
		};
		const res = {
			locals: {
				journeyResponse: { answers: { workshops: [] } }
			}
		};
		const questions: Record<string, any> = {
			gateway2WorkshopDocuments: {
				actionLink: {
					href: '/case/PLAN-111111/gateway-2/workshop/gateway-2-workshop-documents/check',
					text: 'View'
				}
			}
		};
		const next = mock.fn();

		await preprocessQuestionProperties(service, 'gateway-2', questions)(
			req as unknown as Request,
			res as unknown as Response,
			next
		);

		assert.equal(questions.gateway2WorkshopDocuments.actionLink, undefined);
		assert.equal(next.mock.callCount(), 1);
	});

	it('can preprocess gateway3 when the documents have not been submitted', async () => {
		const service = createService();
		service.db.case.findUnique.mock.mockImplementation(async () => ({
			gateway3Info: {
				submissions: [
					{
						id: 'someId',
						decision: undefined,
						completionDate: undefined,
						gateway3InfoId: undefined
					}
				]
			}
		}));
		const res = {
			render: mock.fn(() => {})
		};
		const req = {
			session: {},
			params: {
				reference: caseReference,
				planReference: caseReference,
				question: 'some-brand-new-question',
				section: 'some-new-section'
			},
			originalUrl: 'url-to-redirect-do/some-postfix'
		};
		const questions: Record<string, any> = {
			'gateway3Decision-1': {
				formatSummaryValue: 'aValueThatShouldBeOverridden'
			},
			'gateway3Documents-1': {
				config: {}
			}
		};
		const expectedModifiedQuestions: Record<string, any> = {
			'gateway3Documents-1': {
				changeActionText: 'View',
				editable: true,
				config: {
					actionButtonVisibleInSummary: false
				}
			}
		};
		const myNextFunction = mock.fn(() => {});
		const handler = preprocessQuestionProperties(service, journeyId, questions);
		await handler(req as unknown as Request, res as unknown as Response, myNextFunction);
		assert.equal(myNextFunction.mock.callCount(), 1);
		const actualDecisionQuestion = questions['gateway3Decision-1'];
		delete questions['gateway3Decision-1'];
		assert.deepEqual(questions, expectedModifiedQuestions);
		assert.equal(typeof actualDecisionQuestion.formatSummaryValue, 'function');
	});
	it('can preprocess gateway3 when the documents have submitted', async () => {
		const service = createService();
		service.db.case.findUnique.mock.mockImplementation(async () => ({
			gateway3Info: {
				submissions: [
					{
						id: 'someId',
						decision: '1',
						completionDate: new Date(2026, 0, 1),
						gateway3InfoId: undefined
					}
				]
			}
		}));
		const res = {
			render: mock.fn(() => {})
		};
		const req = {
			session: {},
			params: {
				reference: caseReference,
				planReference: caseReference,
				question: 'some-brand-new-question',
				section: 'some-new-section'
			},
			originalUrl: 'url-to-redirect-do/some-postfix'
		};
		const questions: Record<string, any> = {
			'gateway3Decision-1': {},
			'gateway3Documents-1': {
				config: {}
			}
		};
		const expectedModifiedQuestions: Record<string, any> = {
			'gateway3Documents-1': {
				changeActionText: 'View',
				editable: false,
				config: {
					actionButtonVisibleInSummary: true
				}
			}
		};
		const myNextFunction = mock.fn(() => {});
		const handler = preprocessQuestionProperties(service, journeyId, questions);
		await handler(req as unknown as Request, res as unknown as Response, myNextFunction);
		assert.equal(myNextFunction.mock.callCount(), 1);
		const actualDecisionQuestion = questions['gateway3Decision-1'];
		delete questions['gateway3Decision-1'];
		assert.deepEqual(questions, expectedModifiedQuestions);
		assert.equal(typeof actualDecisionQuestion.formatSummaryValue, 'function');
		assert.deepEqual(actualDecisionQuestion.actionLink, {
			href: `/case/some-case-reference/gateway-3-report/gateway-3-submission-1/gateway-3-document-1/check`,
			text: 'View'
		});
	});
});
describe('issueGateway3Document', () => {
	const caseReference = 'some-case-reference';
	it('sets the examination status to ready to start when issuing a proceed to examination decision', async () => {
		const service = createService();
		service.db.gateway3Info.findUnique.mock.mockImplementation(async () => ({
			completionDate: undefined,
			submissions: [
				{
					id: 'someId',
					decision: GATEWAY_3_DECISION_ID.PROCEED_TO_EXAMINATION,
					completionDate: undefined,
					gateway3InfoId: undefined
				}
			]
		}));
		const handler = issueGateway3Document(service);
		const res = {
			redirect: mock.fn(() => {})
		};
		const req = {
			session: {},
			params: {
				reference: caseReference,
				planReference: caseReference,
				question: 'some-brand-new-question',
				section: 'some-new-section'
			},
			originalUrl: 'url-to-redirect-do/some-postfix'
		};
		await handler(req as unknown as Request, res as unknown as Response);
		assert.equal(service.db.$transaction.mock.callCount(), 1);
		assert.equal(service.db.gateway3Info.upsert.mock.callCount(), 1);
		assert.equal(service.db.examinationInfo.updateMany.mock.callCount(), 1);
		assert.equal(service.db.case.update.mock.callCount(), 1);
		assert.deepEqual(service.db.examinationInfo.updateMany.mock.calls[0].arguments[0], {
			where: {
				caseId: CASE_ID,
				status: EXAMINATION_STATUS_ID.CANNOT_START_YET
			},
			data: {
				status: EXAMINATION_STATUS_ID.READY_TO_START
			}
		});
	});
	it('does not change the examination status when issuing a resubmission required decision', async () => {
		const service = createService();
		service.db.gateway3Info.findUnique.mock.mockImplementation(async () => ({
			submissions: [
				{
					id: 'someId',
					decision: GATEWAY_3_DECISION_ID.RESUBMISSION_REQUIRED,
					completionDate: undefined,
					gateway3InfoId: undefined
				}
			]
		}));
		const handler = issueGateway3Document(service);
		const res = {
			redirect: mock.fn(() => {})
		};
		const req = {
			session: {},
			params: {
				reference: caseReference,
				planReference: caseReference,
				question: 'some-brand-new-question',
				section: 'some-new-section'
			},
			originalUrl: 'url-to-redirect-do/some-postfix'
		};
		await handler(req as unknown as Request, res as unknown as Response);
		assert.equal(service.db.$transaction.mock.callCount(), 1);
		assert.equal(service.db.gateway3Info.upsert.mock.callCount(), 1);
		assert.equal(service.db.examinationInfo.updateMany.mock.callCount(), 0);
		assert.equal(service.db.case.update.mock.callCount(), 1);
	});
	it('fails the issue transaction when no examination record can be made ready', async () => {
		const service = createService();
		service.db.gateway3Info.findUnique.mock.mockImplementation(async () => ({
			submissions: [
				{
					id: 'someId',
					decision: GATEWAY_3_DECISION_ID.PROCEED_TO_EXAMINATION,
					completionDate: undefined,
					gateway3InfoId: undefined
				}
			]
		}));
		service.db.examinationInfo.updateMany.mock.mockImplementation(async () => ({ count: 0 }));
		service.db.examinationInfo.findUnique.mock.mockImplementation(async () => null);
		const handler = issueGateway3Document(service);
		const res = {
			redirect: mock.fn(() => {})
		};
		const req = {
			session: {},
			params: {
				reference: caseReference,
				question: 'gateway-3-document-1'
			}
		};

		await assert.rejects(
			handler(req as unknown as Request, res as unknown as Response),
			/Could not find examination information/
		);
		assert.equal(service.db.$transaction.mock.callCount(), 1);
		assert.equal(service.db.case.update.mock.callCount(), 0);
		assert.equal(res.redirect.mock.callCount(), 0);
		assert.equal(req.session.alerts, undefined);
	});
	it('fails the issue transaction when more than one examination record is updated', async () => {
		const service = createService();
		service.db.gateway3Info.findUnique.mock.mockImplementation(async () => ({
			submissions: [
				{
					id: 'someId',
					decision: GATEWAY_3_DECISION_ID.PROCEED_TO_EXAMINATION,
					completionDate: undefined,
					gateway3InfoId: undefined
				}
			]
		}));
		service.db.examinationInfo.updateMany.mock.mockImplementation(async () => ({ count: 2 }));
		const handler = issueGateway3Document(service);
		const req = {
			session: {},
			params: { reference: caseReference, question: 'gateway-3-document-1' }
		};
		const res = { redirect: mock.fn() };

		await assert.rejects(
			handler(req as unknown as Request, res as unknown as Response),
			/Expected to update one examination record.*updated 2/
		);
		assert.equal(service.db.case.update.mock.callCount(), 0);
		assert.equal(res.redirect.mock.callCount(), 0);
	});
	it('fails the issue transaction when the existing examination status is not available', async () => {
		const service = createService();
		service.db.gateway3Info.findUnique.mock.mockImplementation(async () => ({
			submissions: [
				{
					id: 'someId',
					decision: GATEWAY_3_DECISION_ID.PROCEED_TO_EXAMINATION,
					completionDate: undefined,
					gateway3InfoId: undefined
				}
			]
		}));
		service.db.examinationInfo.updateMany.mock.mockImplementation(async () => ({ count: 0 }));
		service.db.examinationInfo.findUnique.mock.mockImplementation(async () => ({
			status: EXAMINATION_STATUS_ID.CANNOT_START_YET
		}));
		const handler = issueGateway3Document(service);
		const req = {
			session: {},
			params: { reference: caseReference, question: 'gateway-3-document-1' }
		};
		const res = { redirect: mock.fn() };

		await assert.rejects(
			handler(req as unknown as Request, res as unknown as Response),
			/Could not make examination available/
		);
		assert.equal(service.db.case.update.mock.callCount(), 0);
		assert.equal(res.redirect.mock.callCount(), 0);
	});
	it('continues issuing when the examination is already ready to start', async () => {
		const service = createService();
		service.db.gateway3Info.findUnique.mock.mockImplementation(async () => ({
			submissions: [
				{
					id: 'someId',
					decision: GATEWAY_3_DECISION_ID.PROCEED_TO_EXAMINATION,
					completionDate: undefined,
					gateway3InfoId: undefined
				}
			]
		}));
		service.db.examinationInfo.updateMany.mock.mockImplementation(async () => ({ count: 0 }));
		service.db.examinationInfo.findUnique.mock.mockImplementation(async () => ({
			status: EXAMINATION_STATUS_ID.READY_TO_START
		}));
		const handler = issueGateway3Document(service);
		const res = {
			redirect: mock.fn(() => {})
		};
		const req = {
			session: {},
			params: {
				reference: caseReference,
				question: 'gateway-3-document-1'
			}
		};

		await handler(req as unknown as Request, res as unknown as Response);
		assert.equal(service.db.examinationInfo.findUnique.mock.callCount(), 1);
		assert.equal(service.db.case.update.mock.callCount(), 1);
		assert.deepEqual(req.session.alerts[0], {
			type: 'success',
			text: 'Gateway 3 decision issued',
			html: undefined
		});
	});
	it('repairs the examination status when a proceed decision was previously issued', async () => {
		const service = createService();
		service.db.gateway3Info.findUnique.mock.mockImplementation(async () => ({
			submissions: [
				{
					id: 'someId',
					decision: GATEWAY_3_DECISION_ID.PROCEED_TO_EXAMINATION,
					completionDate: new Date(2026, 1, 1),
					gateway3InfoId: undefined
				}
			]
		}));
		const handler = issueGateway3Document(service);
		const res = {
			redirect: mock.fn(() => {})
		};
		const req = {
			session: {},
			params: {
				reference: caseReference,
				question: 'gateway-3-document-1'
			}
		};

		await handler(req as unknown as Request, res as unknown as Response);
		assert.equal(service.db.$transaction.mock.callCount(), 1);
		assert.equal(service.db.gateway3Info.upsert.mock.callCount(), 0);
		assert.equal(service.db.examinationInfo.updateMany.mock.callCount(), 1);
		assert.deepEqual(req.session.alerts[0], {
			type: 'success',
			text: 'Gateway 3 decision already issued. Examination is ready to start',
			html: undefined
		});
	});
	it('issue document when created date is already set', async () => {
		const service = createService();
		service.db.gateway3Info.findUnique.mock.mockImplementation(async () => ({
			submissions: [
				{
					id: 'someId',
					decision: undefined,
					completionDate: new Date(2026, 1, 0),
					gateway3InfoId: undefined
				}
			]
		}));
		const handler = issueGateway3Document(service);
		const res = {
			redirect: mock.fn(() => {})
		};
		const req = {
			session: {},
			params: {
				reference: caseReference,
				planReference: caseReference,
				question: 'some-brand-new-question',
				section: 'some-new-section'
			},
			originalUrl: 'url-to-redirect-do/some-postfix'
		};
		await handler(req as unknown as Request, res as unknown as Response);
		assert.equal(service.db.gateway3Info.upsert.mock.callCount(), 0);
		assert.equal(service.db.examinationInfo.updateMany.mock.callCount(), 0);
	});
});

describe('issueGateway2WorkshopDocuments', () => {
	it('shows the workshop documents uploaded success message', async () => {
		const service = createService();
		service.db.gateway2Info.findUnique.mock.mockImplementation(async () => ({
			workshopDocumentUploadedDate: null
		}));
		const handler = issueGateway2WorkshopDocuments(service, 'gateway-2');
		const req = {
			session: {},
			params: { reference: REFERENCE }
		};
		const res = {
			redirect: mock.fn()
		};

		await handler(req as unknown as Request, res as unknown as Response);
		const expectedMessage = {
			type: 'success',
			text: 'Workshop document(s) uploaded',
			html: undefined
		};
		assert.deepEqual(req.session.alerts[0], expectedMessage);
		assert.equal(service.db.gateway2Info.upsert.mock.callCount(), 1);
		assert.ok(
			service.db.gateway2Info.upsert.mock.calls[0].arguments[0].update.workshopDocumentUploadedDate instanceof Date
		);
		assert.equal(service.db.case.update.mock.callCount(), 1);
		assert.match(
			service.db.case.update.mock.calls[0].arguments[0].data.caseHistories.create[0].event,
			/^Gateway 2 workshop documents uploaded on /
		);
		assert.deepEqual(res.redirect.mock.calls[0].arguments, [`/case/${REFERENCE}/gateway-2`]);
	});

	it('does not issue workshop documents again', async () => {
		const service = createService();
		service.db.gateway2Info.findUnique.mock.mockImplementation(async () => ({
			workshopDocumentUploadedDate: new Date('2026-01-01T00:00:00.000Z')
		}));
		const handler = issueGateway2WorkshopDocuments(service, 'gateway-2');
		const req = {
			session: {},
			params: { reference: REFERENCE }
		};
		const res = {
			redirect: mock.fn()
		};

		await handler(req as unknown as Request, res as unknown as Response);
		const expectedMessage = {
			type: 'important',
			text: 'Gateway 2 workshopDocuments already issued',
			html: undefined
		};
		assert.deepEqual(req.session.alerts[0], expectedMessage);
		assert.equal(service.db.gateway2Info.upsert.mock.callCount(), 0);
		assert.equal(service.db.case.update.mock.callCount(), 0);
	});
});
