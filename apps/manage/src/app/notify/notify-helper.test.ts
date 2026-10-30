import assert from 'node:assert/strict';
import { before, describe, it, mock } from 'node:test';
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
						lpas: [{ lpaName: 'Test Council' }],
						planType: 'local-plan',
						contacts: [{ email: ' lpa@example.com ' }, { email: ' lpa@example.com ' }]
					}))
				},
				gateway2Info: {
					findUnique: mock.fn(async () => ({
						assessorName: 'inspector-id',
						actualDate: new Date('2026-03-01T00:00:00.000Z')
					}))
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
