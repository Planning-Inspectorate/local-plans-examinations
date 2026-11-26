import assert from 'node:assert/strict';
import { before, describe, it, mock } from 'node:test';
import {
	buildCheckReportMiddleware,
	issueGateway2Report,
	issueGateway2WorkshopDocuments,
	updateCaseField
} from '../views/case/controller.ts';
import { caseRouter } from '../views/case/index.ts';
import {
	sendGw2AssessorAppointedNotifyEmail,
	sendGw2WorkshopSetUpNotifyEmail,
	sendGw3AssessorAppointedNotifyEmail,
	sendGw3PassNotifyEmail,
	sendGw3ResubmissionNeededNotifyEmail,
	sendWorkshopDocsUploadedNotifyEmail,
	sendWorkshopReportUploadedNotifyEmail
} from './notify-helper.ts';

const templates = {
	gw2WorkshopInspector: 'gw2_workshop_inspector',
	gw2WorkshopLpa: 'gw2_workshop_lpa',
	gw2AssessorUpdatedAssessor: 'gw2_assessor_updated_assessor',
	gw2AssessorUpdatedLpa: 'gw2_assessor_updated_lpa',
	gw2WorkshopAgenda: 'gw2_workshop_agenda',
	gw2ReportUploaded: 'gw2_report_uploaded',
	gw3AssessorUpdatedAssessor: 'gw3_assessor_updated_assessor',
	gw3AssessorUpdatedLpa: 'gw3_assessor_updated_lpa',
	gw3Pass: 'gw3_passed',
	gw3ResubmissionRequired: 'gw3_resubmission_required'
};

const reference = 'PLAN-123456';
const request = { session: {} };

before(() => {
	process.env.PORTAL_URL = 'https://portal.example.com';
	process.env.GOV_NOTIFY_DISABLED = 'false';
	process.env.GOV_NOTIFY_API_KEY = 'test-api-key';
	process.env.GOV_NOTIFY_WEBHOOK_TOKEN = 'test-webhook-token';
	process.env.LOCAL_PLANS_TEAM_EMAIL = 'team@example.com';

	for (const [key, value] of Object.entries({
		GOV_NOTIFY_GW2_WORKSHOP_INSPECTOR_TEMPLATE_ID: templates.gw2WorkshopInspector,
		GOV_NOTIFY_GW2_WORKSHOP_LPA_TEMPLATE_ID: templates.gw2WorkshopLpa,
		GOV_NOTIFY_GW2_ASSESSOR_UPDATED_ASSESSOR_TEMPLATE_ID: templates.gw2AssessorUpdatedAssessor,
		GOV_NOTIFY_GW2_ASSESSOR_UPDATED_LPA_TEMPLATE_ID: templates.gw2AssessorUpdatedLpa,
		GOV_NOTIFY_GW2_WORKSHOP_AGENDA_TEMPLATE_ID: templates.gw2WorkshopAgenda,
		GOV_NOTIFY_GW2_REPORT_UPLOADED_TEMPLATE_ID: templates.gw2ReportUploaded,
		GOV_NOTIFY_GW3_ASSESSOR_UPDATED_ASSESSOR_TEMPLATE_ID: templates.gw3AssessorUpdatedAssessor,
		GOV_NOTIFY_GW3_ASSESSOR_UPDATED_LPA_TEMPLATE_ID: templates.gw3AssessorUpdatedLpa,
		GOV_NOTIFY_GW3_PASS_TEMPLATE_ID: templates.gw3Pass,
		GOV_NOTIFY_GW3_RESUBMISSION_REQUIRED_TEMPLATE_ID: templates.gw3ResubmissionRequired
	})) {
		process.env[key] = value;
	}
});

function createService() {
	const sendEmail = mock.fn(async () => ({}));
	const entraClient = {
		listAllGroupMembers: mock.fn(async () => [{ id: 'inspector-id' }]),
		getUserEmailFromId: mock.fn(async () => ' inspector@example.com ')
	};

	return {
		service: {
			notifyClient: { sendEmail },
			logger: { warn: mock.fn(), info: mock.fn(), error: mock.fn() },
			db: {
				case: {
					findUnique: mock.fn(async () => ({
						id: 'case-id',
						gateway2Info: { workshops: [] },
						lpas: [{ lpaName: 'Test Council' }],
						planType: 'local-plan',
						contacts: [{ email: ' lpa@example.com ' }, { email: ' lpa@example.com ' }]
					})),
					update: mock.fn(async () => ({}))
				},
				gateway2Info: {
					findUnique: mock.fn(async () => ({
						assessorName: 'inspector-id',
						actualDate: new Date('2026-03-01T00:00:00.000Z')
					})),
					upsert: mock.fn(async () => ({}))
				}
			},
			localPlansTeamEmail: 'team@example.com',
			entraGroupIds: { inspectors: 'inspectors-group' },
			getEntraClient: mock.fn(() => entraClient)
		},
		sendEmail,
		entraClient
	};
}

describe('notify helper functions', () => {
	it('sends workshop set-up emails to the assessor and unique LPA contacts', async () => {
		const { service, sendEmail } = createService();
		const answers = {
			workshops: [{}],
			'workshopDate-1': '1 January 2027',
			'workshopEndDate-1': '2 January 2027',
			'workshopLocationType-1': 'remote'
		};

		await sendGw2WorkshopSetUpNotifyEmail(service, request, reference, answers);

		assert.strictEqual(sendEmail.mock.callCount(), 2);
		assert.deepStrictEqual(
			sendEmail.mock.calls.map(({ arguments: args }) => args.slice(0, 2)),
			[
				[templates.gw2WorkshopInspector, 'inspector@example.com'],
				[templates.gw2WorkshopLpa, 'lpa@example.com']
			]
		);
		assert.strictEqual(sendEmail.mock.calls[0].arguments[2].personalisation.workshop_type, 'remote');
		assert.strictEqual(sendEmail.mock.calls[0].arguments[2].personalisation.if_workshop_online, 'yes');
	});

	it('sends assessor-appointed emails to the assessor and unique LPA contacts', async () => {
		const { service, sendEmail } = createService();

		await sendGw2AssessorAppointedNotifyEmail(service, request, reference, 'inspector-id');

		assert.strictEqual(sendEmail.mock.callCount(), 2);
		assert.deepStrictEqual(
			sendEmail.mock.calls.map(({ arguments: args }) => args.slice(0, 2)),
			[
				[templates.gw2AssessorUpdatedAssessor, 'inspector@example.com'],
				[templates.gw2AssessorUpdatedLpa, 'lpa@example.com']
			]
		);
		assert.strictEqual(sendEmail.mock.calls[0].arguments[2].personalisation.plan_ref, reference);
	});

	it('sends workshop-documents-uploaded emails to unique LPA contacts', async () => {
		const { service, sendEmail } = createService();

		await sendWorkshopDocsUploadedNotifyEmail(service, request, reference);

		assert.strictEqual(sendEmail.mock.callCount(), 1);
		assert.deepStrictEqual(sendEmail.mock.calls[0].arguments.slice(0, 2), [
			templates.gw2WorkshopAgenda,
			'lpa@example.com'
		]);
		assert.strictEqual(sendEmail.mock.calls[0].arguments[2].reference, `create-case:${reference}`);
	});

	it('sends workshop-report-uploaded emails to unique LPA contacts', async () => {
		const { service, sendEmail } = createService();

		await sendWorkshopReportUploadedNotifyEmail(service, request, reference);

		assert.strictEqual(sendEmail.mock.callCount(), 1);
		assert.deepStrictEqual(sendEmail.mock.calls[0].arguments.slice(0, 2), [
			templates.gw2ReportUploaded,
			'lpa@example.com'
		]);
		assert.strictEqual(sendEmail.mock.calls[0].arguments[2].personalisation.authority_name, 'Test Council');
	});

	it('sends GW3 assessor-appointed emails to the assessor and unique LPA contacts', async () => {
		const { service, sendEmail } = createService();

		await sendGw3AssessorAppointedNotifyEmail(service, request, reference, 'inspector-id');

		assert.strictEqual(sendEmail.mock.callCount(), 2);
		assert.deepStrictEqual(
			sendEmail.mock.calls.map(({ arguments: args }) => args.slice(0, 2)),
			[
				[templates.gw3AssessorUpdatedAssessor, 'inspector@example.com'],
				[templates.gw3AssessorUpdatedLpa, 'lpa@example.com']
			]
		);
		assert.strictEqual(sendEmail.mock.calls[0].arguments[2].personalisation.gw3_assessor_initial, 'i');
	});

	it('sends GW3 pass emails to unique LPA contacts', async () => {
		const { service, sendEmail } = createService();

		await sendGw3PassNotifyEmail(service, request, reference);

		assert.strictEqual(sendEmail.mock.callCount(), 1);
		assert.deepStrictEqual(sendEmail.mock.calls[0].arguments.slice(0, 2), [templates.gw3Pass, 'lpa@example.com']);
		assert.strictEqual(sendEmail.mock.calls[0].arguments[2].personalisation.plan_type, 'Local Plan');
	});

	it('sends GW3 resubmission needed emails to unique LPA contacts', async () => {
		const { service, sendEmail } = createService();

		await sendGw3ResubmissionNeededNotifyEmail(service, request, reference);

		assert.strictEqual(sendEmail.mock.callCount(), 1);
		assert.deepStrictEqual(sendEmail.mock.calls[0].arguments.slice(0, 2), [
			templates.gw3ResubmissionRequired,
			'lpa@example.com'
		]);
		assert.strictEqual(sendEmail.mock.calls[0].arguments[2].personalisation.plan_ref, reference);
	});
});

describe('Gateway 2 notification triggers', () => {
	function createContext(section: string, question: string) {
		return {
			req: { session: {}, url: '/gateway-2', params: { reference, section, question } },
			res: { locals: {}, render: mock.fn(), redirect: mock.fn() }
		};
	}

	it('sends the assessor-appointed templates when the assessor is saved', async () => {
		const { service, sendEmail } = createService();
		const { req, res } = createContext('contacts', 'assessor-gateway-2');

		await updateCaseField(service)({ req, res, data: { answers: { assessorName: 'inspector-id' } } });

		assert.equal(service.db.gateway2Info.upsert.mock.callCount(), 1);
		assert.deepEqual(
			sendEmail.mock.calls.map(({ arguments: args }) => args.slice(0, 2)),
			[
				[templates.gw2AssessorUpdatedAssessor, 'inspector@example.com'],
				[templates.gw2AssessorUpdatedLpa, 'lpa@example.com']
			]
		);
	});

	it('does not notify the assessor or LPA when saving the assessor fails', async () => {
		const { service, sendEmail } = createService();
		const { req, res } = createContext('contacts', 'assessor-gateway-2');
		service.db.gateway2Info.upsert.mock.mockImplementation(async () => {
			throw new Error('Save failed');
		});

		await assert.rejects(
			updateCaseField(service)({ req, res, data: { answers: { assessorName: 'inspector-id' } } }),
			/Save failed/
		);
		assert.equal(sendEmail.mock.callCount(), 0);
	});

	it('does not send notifications for an unrelated Gateway 2 date change', async () => {
		const { service, sendEmail } = createService();
		const { req, res } = createContext('gateway-2', 'gateway-2-expected-date');

		await updateCaseField(service)({ req, res, data: { answers: { expectedDate: new Date('2026-03-01') } } });

		assert.equal(service.db.gateway2Info.upsert.mock.callCount(), 1);
		assert.equal(sendEmail.mock.callCount(), 0);
	});

	it('does not notify while workshop answers are still being saved to the session', async () => {
		const { service, sendEmail } = createService();
		const { req, res } = createContext('set-up-workshop', 'gateway-2-location-type-1');

		await updateCaseField(service)({ req, res, data: { answers: { 'workshopLocationType-1': 'remote' } } });

		assert.equal(req.session.answers.workshops[0].workshopLocationType, 'remote');
		assert.equal(service.db.gateway2Info.upsert.mock.callCount(), 0);
		assert.equal(sendEmail.mock.callCount(), 0);
	});

	it('sends the workshop templates when the workshop confirmation is submitted', async () => {
		const { service, sendEmail } = createService();
		const { req, res } = createContext('set-up-workshop', 'check-your-answers-1');
		req.url = '/gateway-2/set-up-workshop/check-your-answers-1';
		res.locals.journeyResponse = {
			answers: { workshops: [{}], 'workshopDate-1': '1 January 2027', 'workshopLocationType-1': 'remote' }
		};
		const route = caseRouter(service).stack.find(
			({ route }) => route?.path === '/gateway-2/set-up-workshop/check-your-answers-*workshopId' && route.methods.post
		);
		assert.ok(route);

		await new Promise<void>((resolve, reject) => {
			res.redirect = mock.fn(resolve);
			route.route.stack.at(-1).handle(req, res, reject);
		});

		assert.equal(service.db.gateway2Info.upsert.mock.callCount(), 1);
		assert.deepEqual(
			sendEmail.mock.calls.map(({ arguments: args }) => args.slice(0, 2)),
			[
				[templates.gw2WorkshopInspector, 'inspector@example.com'],
				[templates.gw2WorkshopLpa, 'lpa@example.com']
			]
		);
		assert.equal(res.redirect.mock.calls[0].arguments[0], `/case/${reference}/gateway-2`);
	});

	for (const { name, section, question, field, issue, template } of [
		{
			name: 'Gateway 2 report',
			section: 'report',
			question: 'gateway-2-report',
			field: 'gateway2Report',
			issue: issueGateway2Report,
			template: templates.gw2ReportUploaded
		},
		{
			name: 'workshop documents',
			section: 'workshop',
			question: 'gateway-2-workshop-documents',
			field: 'gateway2WorkshopDocuments',
			issue: issueGateway2WorkshopDocuments,
			template: templates.gw2WorkshopAgenda
		}
	]) {
		it(`sends the ${name} template only when issue is confirmed`, async () => {
			const { service, sendEmail } = createService();
			const { req, res } = createContext(section, question);
			req.originalUrl = `/case/${reference}/gateway-2/${section}/${question}/check`;
			req.session.fileUploader = {
				[`${reference}:${field}`]: {
					uploadedFiles: [{ fileName: 'report.pdf', metadata: { documentGuid: 'document-id' } }]
				}
			};

			await buildCheckReportMiddleware(service, 'gateway-2')(req, res);
			assert.equal(res.render.mock.callCount(), 1);
			assert.equal(sendEmail.mock.callCount(), 0);

			await issue(service, 'gateway-2')(req, res);

			assert.equal(service.db.gateway2Info.upsert.mock.callCount(), 1);
			assert.deepEqual(
				sendEmail.mock.calls.map(({ arguments: args }) => args.slice(0, 2)),
				[[template, 'lpa@example.com']]
			);
			assert.equal(res.redirect.mock.calls[0].arguments[0], `/case/${reference}/gateway-2`);
		});
	}
});
