import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it, mock } from 'node:test';
import {
	buildCheckReportMiddleware,
	issueGateway2Report,
	issueGateway2WorkshopDocuments,
	updateCaseField
} from '../views/case/controller.ts';
import { resetGovNotifyConfig } from '../config.ts';
import { caseRouter } from '../views/case/index.ts';
import { type NotifyEmailTemplateKey, TemplateLogMessages } from './notify-consts.ts';
import {
	sendAppointedInspectorNotifyEmail,
	sendExaminationNotifyEmail,
	sendGw2AssessorAppointedNotifyEmail,
	sendGw2WorkshopSetUpNotifyEmail,
	sendGw3AssessorAppointedNotifyEmail,
	sendGw3PassNotifyEmail,
	sendGw3ResubmissionNeededNotifyEmail,
	sendLPANotifications,
	sendNotifyEmail,
	sendSoundNotifyEmail,
	sendUnSoundNotifyEmail,
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
	gw3ResubmissionRequired: 'gw3_resubmission_required',
	appointedInspector: 'appointed_inspector',
	appointedInspectorLpa: 'appointed_inspector_lpa',
	examinationOutcomeSound: 'examination_outcome_sound',
	examinationOutcomeUnsound: 'examination_outcome_unsound'
};

const reference = 'PLAN-123456';
const request = { session: {} };

const testEnv = {
	PORTAL_URL: 'https://portal.example.com',
	GOV_NOTIFY_DISABLED: 'false',
	GOV_NOTIFY_API_KEY: 'test-api-key',
	GOV_NOTIFY_WEBHOOK_TOKEN: 'test-webhook-token',
	LOCAL_PLANS_TEAM_EMAIL: 'team@example.com',
	GOV_NOTIFY_GW2_WORKSHOP_INSPECTOR_TEMPLATE_ID: templates.gw2WorkshopInspector,
	GOV_NOTIFY_GW2_WORKSHOP_LPA_TEMPLATE_ID: templates.gw2WorkshopLpa,
	GOV_NOTIFY_GW2_ASSESSOR_UPDATED_ASSESSOR_TEMPLATE_ID: templates.gw2AssessorUpdatedAssessor,
	GOV_NOTIFY_GW2_ASSESSOR_UPDATED_LPA_TEMPLATE_ID: templates.gw2AssessorUpdatedLpa,
	GOV_NOTIFY_GW2_WORKSHOP_AGENDA_TEMPLATE_ID: templates.gw2WorkshopAgenda,
	GOV_NOTIFY_GW2_REPORT_UPLOADED_TEMPLATE_ID: templates.gw2ReportUploaded,
	GOV_NOTIFY_GW3_ASSESSOR_UPDATED_ASSESSOR_TEMPLATE_ID: templates.gw3AssessorUpdatedAssessor,
	GOV_NOTIFY_GW3_ASSESSOR_UPDATED_LPA_TEMPLATE_ID: templates.gw3AssessorUpdatedLpa,
	GOV_NOTIFY_GW3_PASS_TEMPLATE_ID: templates.gw3Pass,
	GOV_NOTIFY_GW3_RESUBMISSION_REQUIRED_TEMPLATE_ID: templates.gw3ResubmissionRequired,
	GOV_NOTIFY_APPOINTED_INSPECTOR_TEMPLATE_ID: templates.appointedInspector,
	GOV_NOTIFY_APPOINTED_INSPECTOR_LPA_TEMPLATE_ID: templates.appointedInspectorLpa,
	GOV_NOTIFY_EXAMINATION_OUTCOME_SOUND_TEMPLATE_ID: templates.examinationOutcomeSound,
	GOV_NOTIFY_EXAMINATION_OUTCOME_UNSOUND_TEMPLATE_ID: templates.examinationOutcomeUnsound
};

const previousEnv = new Map<string, string | undefined>();

beforeEach(() => {
	resetGovNotifyConfig();

	for (const [key, value] of Object.entries(testEnv)) {
		previousEnv.set(key, process.env[key]);
		process.env[key] = value;
	}
});

afterEach(() => {
	for (const [key, value] of previousEnv) {
		if (value === undefined) {
			delete process.env[key];
		} else {
			process.env[key] = value;
		}
	}

	previousEnv.clear();
	resetGovNotifyConfig();
});

const inspectorNames: Record<string, { givenName: string | null; surname: string | null }> = {
	'inspector-1': { givenName: 'jane', surname: 'Smith' },
	'inspector-2': { givenName: 'Alex', surname: 'Jones' }
};

function createService() {
	const sendEmail = mock.fn(async () => ({}));
	const entraClient = {
		listAllGroupMembers: mock.fn(async () => [{ id: 'inspector-id' }]),
		getUserEmailFromId: mock.fn(async (_id: string) => ' inspector@example.com '),
		getUserName: mock.fn(async (id: string) => inspectorNames[id] ?? { givenName: null, surname: null })
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
						contacts: [{ email: ' lpa@example.com ' }, { email: ' lpa@example.com ' }],
						examinationInfo: { examiningInspector1: 'inspector-1', examiningInspector2: 'inspector-2' }
					})),
					update: mock.fn(async () => ({}))
				},
				gateway2Info: {
					findUnique: mock.fn(async () => ({
						assessorName: 'inspector-id',
						actualDate: new Date('2026-03-01T00:00:00.000Z')
					})),
					upsert: mock.fn(async () => ({}))
				},
				examinationInfo: {
					findUnique: mock.fn(async (_args: unknown) => ({
						examiningInspector1: 'inspector-1',
						examiningInspector2: 'inspector-2',
						examiningInspector3: null
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

describe('sendNotifyEmail', () => {
	const examinationTemplates: { templateKey: NotifyEmailTemplateKey; expectedTemplateId: string }[] = [
		{ templateKey: 'appointedInspector', expectedTemplateId: templates.appointedInspector },
		{ templateKey: 'appointedInspectorLpa', expectedTemplateId: templates.appointedInspectorLpa },
		{ templateKey: 'examinationOutcomeSound', expectedTemplateId: templates.examinationOutcomeSound },
		{ templateKey: 'examinationOutcomeUnsound', expectedTemplateId: templates.examinationOutcomeUnsound }
	];

	for (const { templateKey, expectedTemplateId } of examinationTemplates) {
		it(`sends the ${templateKey} template once to each unique LPA contact`, async () => {
			const { service, sendEmail } = createService();

			await sendNotifyEmail(service, reference, templateKey);

			assert.strictEqual(sendEmail.mock.callCount(), 1);
			assert.deepStrictEqual(sendEmail.mock.calls[0].arguments.slice(0, 2), [expectedTemplateId, 'lpa@example.com']);
			assert.strictEqual(sendEmail.mock.calls[0].arguments[2].reference, `create-case:${reference}`);
		});

		it(`sends the ${templateKey} template only to explicit recipients when provided`, async () => {
			const { service, sendEmail } = createService();
			const explicitRecipient = 'explicit@example.com';

			await sendNotifyEmail(service, reference, templateKey, { recipients: [explicitRecipient] });

			assert.strictEqual(sendEmail.mock.callCount(), 1);
			assert.deepStrictEqual(sendEmail.mock.calls[0].arguments.slice(0, 2), [expectedTemplateId, explicitRecipient]);
		});
	}

	it('sends nothing when explicit recipients is an empty list', async () => {
		const { service, sendEmail } = createService();

		await sendNotifyEmail(service, reference, 'examinationOutcomeSound', { recipients: [] });

		assert.strictEqual(sendEmail.mock.callCount(), 0);
	});

	it('builds the shared personalisation and lets callers add to or override it', async () => {
		const { service, sendEmail } = createService();
		service.db.case.findUnique.mock.mockImplementation(async () => ({
			id: 'case-id',
			lpas: [{ lpaName: 'North Council' }, { lpaName: 'South Council' }],
			planType: 'joint-LOCAL-plan',
			contacts: [{ email: 'lpa@example.com' }]
		}));

		await sendNotifyEmail(service, reference, 'examinationOutcomeSound', {
			personalisation: { extra_field: 'extra', contact_info: 'Call us' }
		});

		assert.deepStrictEqual(sendEmail.mock.calls[0].arguments[2], {
			personalisation: {
				portalLoginURL: 'https://portal.example.com/login',
				plan_ref: reference,
				authority_name: 'North Council, South Council',
				plan_type: 'Joint Local Plan',
				team_email_address: 'team@example.com',
				contact_info: 'Call us',
				extra_field: 'extra'
			},
			reference: `create-case:${reference}`
		});
	});

	it('logs a success message for each recipient using the template log messages', async () => {
		const { service } = createService();

		await sendNotifyEmail(service, reference, 'examinationOutcomeUnsound', {
			recipients: ['a@example.com', 'b@example.com']
		});

		assert.deepStrictEqual(
			service.logger.info.mock.calls.map(({ arguments: args }) => args),
			[
				[
					{ email: 'a@example.com', templateKey: 'examinationOutcomeUnsound' },
					TemplateLogMessages.examinationOutcomeUnsound.emailSent
				],
				[
					{ email: 'b@example.com', templateKey: 'examinationOutcomeUnsound' },
					TemplateLogMessages.examinationOutcomeUnsound.emailSent
				]
			]
		);
		assert.strictEqual(service.logger.error.mock.callCount(), 0);
	});

	it('keeps sending to the remaining recipients and logs failures without the request headers', async () => {
		const { service, sendEmail } = createService();
		sendEmail.mock.mockImplementationOnce(async () => {
			throw Object.assign(new Error('Request failed with status code 400'), {
				config: { headers: { Authorization: 'Bearer secret-api-key' } },
				response: { status: 400, data: { errors: [{ error: 'BadRequestError', message: 'Bad template' }] } }
			});
		});

		await sendNotifyEmail(service, reference, 'examinationOutcomeSound', {
			recipients: ['fails@example.com', 'works@example.com']
		});

		assert.strictEqual(sendEmail.mock.callCount(), 2);
		assert.strictEqual(service.logger.info.mock.callCount(), 1);
		assert.strictEqual(service.logger.info.mock.calls[0].arguments[0].email, 'works@example.com');
		assert.strictEqual(service.logger.error.mock.callCount(), 1);
		assert.deepStrictEqual(service.logger.error.mock.calls[0].arguments, [
			{
				email: 'fails@example.com',
				templateKey: 'examinationOutcomeSound',
				message: 'Request failed with status code 400',
				status: 400,
				errors: [{ error: 'BadRequestError', message: 'Bad template' }]
			},
			TemplateLogMessages.examinationOutcomeSound.failedToSend
		]);
		assert.ok(!JSON.stringify(service.logger.error.mock.calls).includes('secret-api-key'));
	});

	it('warns and sends nothing when the Notify client is not configured', async () => {
		const { service, sendEmail } = createService();
		const serviceWithoutClient = { ...service, notifyClient: undefined };

		await sendNotifyEmail(serviceWithoutClient, reference, 'examinationOutcomeSound');

		assert.strictEqual(service.logger.warn.mock.callCount(), 1);
		assert.strictEqual(service.logger.warn.mock.calls[0].arguments[0], 'Notify client not configured');
		assert.strictEqual(service.db.case.findUnique.mock.callCount(), 0);
		assert.strictEqual(sendEmail.mock.callCount(), 0);
	});

	it('does not send any email when Gov Notify is disabled', async () => {
		process.env.GOV_NOTIFY_DISABLED = 'true';
		const { service, sendEmail } = createService();

		await sendNotifyEmail(service, reference, 'examinationOutcomeSound');

		assert.strictEqual(sendEmail.mock.callCount(), 0);
		assert.strictEqual(service.db.case.findUnique.mock.callCount(), 0);
		assert.strictEqual(service.logger.warn.mock.callCount(), 0);
	});

	it('throws when PORTAL_URL is not set', async () => {
		delete process.env.PORTAL_URL;
		const { service, sendEmail } = createService();

		await assert.rejects(sendNotifyEmail(service, reference, 'examinationOutcomeSound'), {
			message: 'PORTAL_URL environment variable is not set'
		});
		assert.strictEqual(sendEmail.mock.callCount(), 0);
	});

	it('throws naming the environment variable when the template id is not configured', async () => {
		process.env.GOV_NOTIFY_GW3_PASS_TEMPLATE_ID = '';
		const { service, sendEmail } = createService();

		await assert.rejects(sendNotifyEmail(service, reference, 'gw3Pass'), {
			message: 'GOV_NOTIFY_GW3_PASS_TEMPLATE_ID environment variable is not set'
		});
		assert.strictEqual(sendEmail.mock.callCount(), 0);
	});

	for (const { templateKey, envVar } of [
		{ templateKey: 'appointedInspector', envVar: 'GOV_NOTIFY_APPOINTED_INSPECTOR_TEMPLATE_ID' },
		{ templateKey: 'appointedInspectorLpa', envVar: 'GOV_NOTIFY_APPOINTED_INSPECTOR_LPA_TEMPLATE_ID' },
		{ templateKey: 'examinationOutcomeSound', envVar: 'GOV_NOTIFY_EXAMINATION_OUTCOME_SOUND_TEMPLATE_ID' },
		{ templateKey: 'examinationOutcomeUnsound', envVar: 'GOV_NOTIFY_EXAMINATION_OUTCOME_UNSOUND_TEMPLATE_ID' }
	] as const) {
		it(`names ${envVar} when the ${templateKey} template id is not configured`, async () => {
			process.env[envVar] = '';
			const { service } = createService();

			await assert.rejects(sendNotifyEmail(service, reference, templateKey), {
				message: `${envVar} environment variable is not set`
			});
		});
	}
});

describe('sendExaminationNotifyEmail', () => {
	const examinationRequest = { session: {} } as Parameters<typeof sendAppointedInspectorNotifyEmail>[2];

	for (const { templateKey, expectedTemplateId } of [
		{ templateKey: 'examinationOutcomeSound', expectedTemplateId: templates.examinationOutcomeSound },
		{ templateKey: 'examinationOutcomeUnsound', expectedTemplateId: templates.examinationOutcomeUnsound }
	] as const) {
		it(`sends the ${templateKey} outcome to the LPA contacts with the given personalisation`, async () => {
			const { service, sendEmail } = createService();

			await sendExaminationNotifyEmail(service, reference, templateKey, {
				personalisation: { outcome_note: 'note' }
			});

			assert.deepStrictEqual(
				sendEmail.mock.calls.map(({ arguments: args }) => args.slice(0, 2)),
				[[expectedTemplateId, 'lpa@example.com']]
			);
			assert.strictEqual(sendEmail.mock.calls[0].arguments[2].personalisation.outcome_note, 'note');
			assert.strictEqual(service.getEntraClient.mock.callCount(), 0);
		});
	}

	it('sends the appointed inspector template to each examining inspector looked up in Entra', async () => {
		const { service, sendEmail, entraClient } = createService();
		entraClient.getUserEmailFromId.mock.mockImplementation(async (id: string) => ` ${id}@example.com `);

		await sendExaminationNotifyEmail(service, reference, 'appointedInspector', {
			request: examinationRequest,
			personalisation: { extra: 'value' }
		});

		assert.deepStrictEqual(service.db.examinationInfo.findUnique.mock.calls[0].arguments, [
			{ where: { caseId: 'case-id' } }
		]);
		assert.deepStrictEqual(
			entraClient.getUserEmailFromId.mock.calls.map(({ arguments: args }) => args[0]),
			['inspector-1', 'inspector-2']
		);
		assert.deepStrictEqual(
			sendEmail.mock.calls.map(({ arguments: args }) => args.slice(0, 2)),
			[
				[templates.appointedInspector, 'inspector-1@example.com'],
				[templates.appointedInspector, 'inspector-2@example.com']
			]
		);
		assert.strictEqual(sendEmail.mock.calls[0].arguments[2].personalisation.extra, 'value');
		assert.strictEqual(service.logger.error.mock.callCount(), 0);
	});

	it('sends the appointed inspector LPA template with each inspector initial and last name', async () => {
		const { service, sendEmail } = createService();

		await sendExaminationNotifyEmail(service, reference, 'appointedInspectorLpa', {
			request: examinationRequest,
			personalisation: { inspector4_lastname: 'Override' }
		});

		assert.deepStrictEqual(
			sendEmail.mock.calls.map(({ arguments: args }) => args.slice(0, 2)),
			[[templates.appointedInspectorLpa, 'lpa@example.com']]
		);
		const { personalisation } = sendEmail.mock.calls[0].arguments[2];
		assert.deepStrictEqual(
			{
				lead_inspector_initial: personalisation.lead_inspector_initial,
				lead_inspector_lastname: personalisation.lead_inspector_lastname,
				inspector2_initial: personalisation.inspector2_initial,
				inspector2_lastname: personalisation.inspector2_lastname,
				inspector3_initial: personalisation.inspector3_initial,
				inspector3_lastname: personalisation.inspector3_lastname,
				inspector4_initial: personalisation.inspector4_initial,
				inspector4_lastname: personalisation.inspector4_lastname
			},
			{
				lead_inspector_initial: 'J',
				lead_inspector_lastname: 'Smith',
				inspector2_initial: 'A',
				inspector2_lastname: 'Jones',
				inspector3_initial: '',
				inspector3_lastname: '',
				inspector4_initial: '',
				inspector4_lastname: 'Override'
			}
		);
	});

	for (const templateKey of ['appointedInspector', 'appointedInspectorLpa'] as const) {
		it(`logs an error and sends nothing for ${templateKey} when no request is provided`, async () => {
			const { service, sendEmail } = createService();

			await sendExaminationNotifyEmail(service, reference, templateKey);

			assert.strictEqual(sendEmail.mock.callCount(), 0);
			assert.strictEqual(service.logger.error.mock.callCount(), 1);
			const [details, message] = service.logger.error.mock.calls[0].arguments;
			assert.strictEqual(message, 'Failed to send examination notify email');
			assert.strictEqual(details.reference, reference);
			assert.strictEqual(details.templateKey, templateKey);
			assert.match(details.error.message, /Request object is required/);
		});
	}

	it('logs an error when the case cannot be found for the appointed inspector email', async () => {
		const { service, sendEmail } = createService();
		service.db.case.findUnique.mock.mockImplementation(async () => null);

		await sendExaminationNotifyEmail(service, reference, 'appointedInspector', {
			request: examinationRequest
		});

		assert.strictEqual(sendEmail.mock.callCount(), 0);
		assert.strictEqual(service.db.examinationInfo.findUnique.mock.callCount(), 0);
		assert.strictEqual(
			service.logger.error.mock.calls[0].arguments[0].error.message,
			`Case not found for reference '${reference}'`
		);
	});

	it('does not throw when sending fails because of missing configuration', async () => {
		delete process.env.PORTAL_URL;
		const { service, sendEmail } = createService();

		await assert.doesNotReject(sendExaminationNotifyEmail(service, reference, 'examinationOutcomeSound'));

		assert.strictEqual(sendEmail.mock.callCount(), 0);
		assert.match(service.logger.error.mock.calls[0].arguments[0].error.message, /PORTAL_URL/);
	});

	it('does nothing for a template key without an examination handler', async () => {
		const { service, sendEmail } = createService();

		await sendExaminationNotifyEmail(service, reference, 'gw3Pass');

		assert.strictEqual(sendEmail.mock.callCount(), 0);
		assert.strictEqual(service.db.case.findUnique.mock.callCount(), 0);
		assert.strictEqual(service.logger.error.mock.callCount(), 0);
	});

	for (const { name, send, expectedTemplateId } of [
		{ name: 'sendLPANotifications', send: sendLPANotifications, expectedTemplateId: templates.appointedInspectorLpa },
		{ name: 'sendSoundNotifyEmail', send: sendSoundNotifyEmail, expectedTemplateId: templates.examinationOutcomeSound },
		{
			name: 'sendUnSoundNotifyEmail',
			send: sendUnSoundNotifyEmail,
			expectedTemplateId: templates.examinationOutcomeUnsound
		}
	]) {
		it(`${name} sends its template to the LPA contacts`, async () => {
			const { service, sendEmail } = createService();

			await send(service, reference, { custom: 'value' });

			assert.deepStrictEqual(
				sendEmail.mock.calls.map(({ arguments: args }) => args.slice(0, 2)),
				[[expectedTemplateId, 'lpa@example.com']]
			);
			assert.strictEqual(sendEmail.mock.calls[0].arguments[2].personalisation.custom, 'value');
		});
	}
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
