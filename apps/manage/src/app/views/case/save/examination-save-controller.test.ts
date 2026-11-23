import { resetGovNotifyConfig } from '../../../config.ts';
import { ExaminationSaveController } from './examination-save-controller.ts';
import type { ManageService } from '#service';
import type { Request } from 'express';
import { afterEach, beforeEach, describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import type { PlanPauseHistory } from '@pins/local-plans-database/src/client/client.ts';
import { EXAMINATION_STATUS_ID } from '@pins/local-plans-database/src/seed/static-data/ids/index.ts';

function createMockService(examinationStatus?: string) {
	return {
		logger: { warn: mock.fn(), info: mock.fn(), error: mock.fn() },
		getEntraClient: mock.fn(() => null),
		db: {
			case: {
				findUnique: mock.fn(async () => ({
					id: 'someCaseId',
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
						hearings: [{}],
						status: examinationStatus,
						planPauseHistory: [
							{
								createdAt: new Date(2026, 0, 1),
								planPauseDate: new Date(2026, 0, 2),
								planPauseEndDate: new Date(2026, 0, 5)
							},
							{
								createdAt: new Date(2026, 5, 1),
								planPauseDate: new Date(2026, 5, 2),
								planPauseEndDate: new Date(2026, 5, 3)
							}
						]
					}
				})),
				upsert: mock.fn(async () => ({}))
			},
			gateway1Info: {
				findUnique: mock.fn<() => {}>(),
				upsert: mock.fn(async () => ({}))
			},
			gateway2Info: {
				findUnique: mock.fn<() => {}>(),
				upsert: mock.fn(async () => ({}))
			},
			gateway3Info: {
				findUnique: mock.fn<() => {}>(),
				upsert: mock.fn(async () => ({}))
			},
			examinationInfo: {
				findUnique: mock.fn(async (_args: unknown) => ({})),
				upsert: mock.fn(async (_args: unknown) => ({}))
			}
		}
	};
}

const mockDate = new Date('2026-01-01T00:00:00.000Z');
mock.timers.enable({
	apis: ['Date'],
	now: mockDate
});

class ExamSaveControllerWrapper extends ExaminationSaveController {
	public async wrapShouldSaveToSession() {
		return await this.shouldSaveToSession();
	}
	public async wrapPrepareData(answers: Record<string, any>) {
		return await this.prepareData(answers);
	}
	public async wrapSaveToSession(answers: any) {
		return await this.saveToSession(answers);
	}
	public async wrapSaveToDatabase(answers: any) {
		return await this.saveToDatabase(answers);
	}
	public wrapValidatePauses(pauses: PlanPauseHistory[]) {
		return this.validatePauses(pauses);
	}
}

describe('ExaminationSaveController', () => {
	it('saves trimmed Programme officer details on Gateway 3 without changing examination fields', async () => {
		const service = createMockService();
		const req = { params: { question: 'programme-officer' } } as unknown as Request;
		const controller = new ExaminationSaveController(service as unknown as ManageService, req, 'caseRef');
		const result = await controller.prepareAndSave({
			programmeOfficerFirstName: '  Jane  ',
			programmeOfficerLastName: ' Officer ',
			programmeOfficerEmail: ' jane@example.com ',
			programmeOfficerPhone: ' 01234 567890 ',
			examiningInspector1: 'not-an-officer-field'
		});

		const data = {
			programmeOfficerFirstName: 'Jane',
			programmeOfficerLastName: 'Officer',
			programmeOfficerEmail: 'jane@example.com',
			programmeOfficerPhone: '01234 567890'
		};
		assert.deepEqual(service.db.gateway3Info.upsert.mock.calls[0].arguments, [
			{
				where: { caseId: 'someCaseId' },
				update: data,
				create: { caseId: 'someCaseId', ...data }
			}
		]);
		assert.equal(service.db.examinationInfo.upsert.mock.callCount(), 0);
		assert.deepEqual(result, { dataWritten: true, writtenToDB: true });
	});

	for (const phone of ['', undefined]) {
		it(`clears an optional Programme officer phone when ${phone === '' ? 'blank' : 'omitted'}`, async () => {
			const service = createMockService();
			const req = { params: { question: 'programme-officer' } } as unknown as Request;
			const controller = new ExaminationSaveController(service as unknown as ManageService, req, 'caseRef');
			await controller.prepareAndSave({
				programmeOfficerFirstName: 'Jane',
				programmeOfficerLastName: 'Officer',
				programmeOfficerEmail: 'jane@example.com',
				programmeOfficerPhone: phone
			});

			const query = service.db.gateway3Info.upsert.mock.calls[0].arguments.at(0) as any;
			assert.equal(query.update.programmeOfficerPhone, null);
			assert.equal(query.create.programmeOfficerPhone, null);
		});
	}

	it('can save an examination', async () => {
		const mockService = createMockService();
		const req = { params: { question: 'examining-inspector-1' } } as unknown as Request;
		const answers = {};
		const expectedAnswers = {
			examiningInspectorAppointmentDate: mockDate
		};
		const expectedQuery = {
			where: { caseId: 'someCaseId' },
			update: { ...expectedAnswers },
			create: {
				caseId: 'someCaseId',
				...expectedAnswers
			}
		};
		const examinationController = new ExaminationSaveController(
			mockService as unknown as ManageService,
			req,
			'caseRef'
		);
		await examinationController.prepareAndSave(answers);
		assert.deepEqual(mockService.db.examinationInfo.upsert.mock.calls[0].arguments.at(0), expectedQuery);
	});

	it('moves a submitted examination to In examination when an inspector is assigned', async () => {
		const mockService = createMockService(EXAMINATION_STATUS_ID.SUBMITTED);
		const req = { params: { question: 'examining-inspector-1' } } as unknown as Request;
		const answers = { examiningInspector1: 'inspector-id' };
		const expectedAnswers = {
			...answers,
			examiningInspectorAppointmentDate: mockDate,
			status: EXAMINATION_STATUS_ID.IN_EXAMINATION
		};
		const examinationController = new ExaminationSaveController(
			mockService as unknown as ManageService,
			req,
			'caseRef'
		);

		await examinationController.prepareAndSave(answers);

		assert.deepEqual(mockService.db.examinationInfo.upsert.mock.calls[0].arguments.at(0), {
			where: { caseId: 'someCaseId' },
			update: expectedAnswers,
			create: {
				caseId: 'someCaseId',
				...expectedAnswers
			}
		});
	});

	describe('notifications', () => {
		const templates = {
			appointedInspector: 'inspector-appointed',
			appointedInspectorLpa: 'inspector-appointed-lpa',
			outcomeSound: 'outcome-sound',
			outcomeUnsound: 'outcome-unsound'
		};
		const notifyEnv = {
			PORTAL_URL: 'https://portal.example.com',
			GOV_NOTIFY_DISABLED: 'false',
			GOV_NOTIFY_API_KEY: 'test-api-key',
			GOV_NOTIFY_WEBHOOK_TOKEN: 'test-webhook-token',
			GOV_NOTIFY_APPOINTED_INSPECTOR_TEMPLATE_ID: templates.appointedInspector,
			GOV_NOTIFY_APPOINTED_INSPECTOR_LPA_TEMPLATE_ID: templates.appointedInspectorLpa,
			GOV_NOTIFY_EXAMINATION_OUTCOME_SOUND_TEMPLATE_ID: templates.outcomeSound,
			GOV_NOTIFY_EXAMINATION_OUTCOME_UNSOUND_TEMPLATE_ID: templates.outcomeUnsound
		};
		const previousEnv = new Map<string, string | undefined>();

		beforeEach(() => {
			for (const [key, value] of Object.entries(notifyEnv)) {
				previousEnv.set(key, process.env[key]);
				process.env[key] = value;
			}
			resetGovNotifyConfig();
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

		/**
		 * @param question The question being saved
		 * @param previous The examination values before the save
		 * @param saved The examination values after the save (defaults to the previous values)
		 */
		function createNotifyContext(
			question: string,
			{ previous = {}, saved }: { previous?: Record<string, unknown>; saved?: Record<string, unknown> } = {}
		) {
			const baseService = createMockService();
			const savedExaminationInfo = saved ?? previous;
			let databaseWritten = false;
			const caseRecord = () => ({
				id: 'someCaseId',
				lpas: [{ lpaName: 'Test Council' }],
				planType: 'local-plan',
				contacts: [{ email: 'lpa@example.com' }],
				examinationInfo: {
					hearings: [{}],
					planPauseHistory: [],
					...(databaseWritten ? savedExaminationInfo : previous)
				}
			});
			const sendEmail = mock.fn(async (_template: string, _email: string, _options: unknown) => ({}));
			const entraClient = {
				getUserEmailFromId: mock.fn(async (id: string) => `${id}@example.com`),
				getUserName: mock.fn(async (_id: string) => ({ givenName: 'Jane', surname: 'Smith' }))
			};
			const service = {
				...baseService,
				getEntraClient: mock.fn(() => entraClient),
				db: {
					...baseService.db,
					case: { ...baseService.db.case, findUnique: mock.fn(async () => caseRecord()) },
					examinationInfo: {
						findUnique: mock.fn(async (_args: unknown) => (databaseWritten ? savedExaminationInfo : previous)),
						upsert: mock.fn(async (_args: unknown) => {
							databaseWritten = true;
							return {};
						})
					}
				},
				notifyClient: { sendEmail },
				localPlansTeamEmail: 'team@example.com'
			};
			const req = { params: { question }, session: {} } as unknown as Request;
			const controller = new ExaminationSaveController(service as unknown as ManageService, req, 'caseRef');

			return { controller, service, sendEmail, req };
		}

		const sentEmails = (sendEmail: { mock: { calls: { arguments: unknown[] }[] } }) =>
			sendEmail.mock.calls.map(({ arguments: args }) => args.slice(0, 2));

		describe('appointed inspector', () => {
			for (const field of ['examiningInspector1', 'examiningInspector2', 'examiningInspector3']) {
				const question = `examining-inspector-${field.at(-1)}`;

				it(`queues the appointed inspector when ${question} is saved without sending emails`, async () => {
					const answers = { [field]: 'inspector-id' };
					const { controller, service, sendEmail, req } = createNotifyContext(question, { saved: answers });

					const result = await controller.prepareAndSave({ ...answers });

					assert.deepStrictEqual(result, { dataWritten: true, writtenToDB: true });
					assert.strictEqual(service.db.examinationInfo.upsert.mock.callCount(), 1);
					assert.deepStrictEqual(sentEmails(sendEmail), []);
					assert.deepStrictEqual((req.session as any).pendingExaminationInspectorNotification, {
						inspectorIds: ['inspector-id']
					});
					assert.strictEqual(service.logger.error.mock.callCount(), 0);
				});
			}

			it('only queues the newly appointed inspector, not the inspectors already on the case', async () => {
				const previous = { examiningInspector1: 'inspector-1' };
				const saved = { examiningInspector1: 'inspector-1', examiningInspector2: 'inspector-2' };
				const { controller, sendEmail, req } = createNotifyContext('examining-inspector-2', { previous, saved });

				await controller.prepareAndSave({ examiningInspector2: 'inspector-2' });

				assert.deepStrictEqual(sentEmails(sendEmail), []);
				assert.deepStrictEqual((req.session as any).pendingExaminationInspectorNotification, {
					inspectorIds: ['inspector-2']
				});
			});

			it('queues the replacement inspector when an inspector is changed', async () => {
				const previous = { examiningInspector1: 'inspector-1', examiningInspector2: 'inspector-2' };
				const saved = { examiningInspector1: 'inspector-3', examiningInspector2: 'inspector-2' };
				const { controller, sendEmail, req } = createNotifyContext('examining-inspector-1', { previous, saved });

				await controller.prepareAndSave({ examiningInspector1: 'inspector-3' });

				assert.deepStrictEqual(sentEmails(sendEmail), []);
				assert.deepStrictEqual((req.session as any).pendingExaminationInspectorNotification, {
					inspectorIds: ['inspector-3']
				});
			});

			for (const { name, question, previous, answers } of [
				{
					name: 'the same inspector is saved again',
					question: 'examining-inspector-1',
					previous: { examiningInspector1: 'inspector-1' },
					answers: { examiningInspector1: 'inspector-1' }
				},
				{
					name: 'the inspector is already appointed in another slot',
					question: 'examining-inspector-2',
					previous: { examiningInspector1: 'inspector-1' },
					answers: { examiningInspector2: 'inspector-1' }
				},
				{
					name: 'the inspector is cleared',
					question: 'examining-inspector-1',
					previous: { examiningInspector1: 'inspector-1' },
					answers: { examiningInspector1: '' }
				},
				{
					name: 'the question has no inspector answer',
					question: 'examining-inspector-1',
					previous: {},
					answers: {}
				},
				{
					name: 'an inspector field is saved by another question',
					question: 'examination-expected-date',
					previous: {},
					answers: { examiningInspector1: 'inspector-1' }
				}
			]) {
				it(`does not send any email when ${name}`, async () => {
					const { controller, service, sendEmail, req } = createNotifyContext(question, { previous });

					const result = await controller.prepareAndSave({ ...answers });

					assert.deepStrictEqual(result, { dataWritten: true, writtenToDB: true });
					assert.strictEqual(service.db.examinationInfo.upsert.mock.callCount(), 1);
					assert.deepStrictEqual(sentEmails(sendEmail), []);
					assert.strictEqual((req.session as any).pendingExaminationInspectorNotification, undefined);
				});
			}
		});

		describe('examination outcome', () => {
			// "Confirm and notify" on the examination report check page saves the report issued status
			const issueReport = { status: EXAMINATION_STATUS_ID.REPORT_ISSUED, soundUnsoundDate: mockDate };
			const reportQuestion = 'examination-report';

			for (const isSound of ['sound', 'sound-with-modifications', 'unsound']) {
				it(`does not send any email when the plan outcome is saved as ${isSound}`, async () => {
					const { controller, service, sendEmail } = createNotifyContext('is-sound', {
						previous: { status: EXAMINATION_STATUS_ID.IN_EXAMINATION }
					});

					const result = await controller.prepareAndSave({ isSound });

					assert.deepStrictEqual(result, { dataWritten: true, writtenToDB: true });
					assert.strictEqual(service.db.examinationInfo.upsert.mock.callCount(), 1);
					assert.deepStrictEqual(sentEmails(sendEmail), []);
				});
			}

			for (const { isSound, template } of [
				{ isSound: 'sound', template: templates.outcomeSound },
				{ isSound: 'sound-with-modifications', template: templates.outcomeSound },
				{ isSound: 'unsound', template: templates.outcomeUnsound }
			]) {
				it(`sends the ${template} email to the LPA contacts when the report is issued for a ${isSound} plan`, async () => {
					const { controller, service, sendEmail } = createNotifyContext(reportQuestion, {
						previous: { status: EXAMINATION_STATUS_ID.IN_EXAMINATION, isSound }
					});

					const result = await controller.prepareAndSave({ ...issueReport });

					assert.deepStrictEqual(result, { dataWritten: true, writtenToDB: true });
					assert.strictEqual(service.db.examinationInfo.upsert.mock.callCount(), 1);
					assert.deepStrictEqual(sentEmails(sendEmail), [[template, 'lpa@example.com']]);
					assert.strictEqual(service.getEntraClient.mock.callCount(), 0);
				});
			}

			for (const status of [EXAMINATION_STATUS_ID.REPORT_ISSUED, EXAMINATION_STATUS_ID.PLAN_ADOPTED]) {
				it(`does not send the outcome email again when the examination is already ${status}`, async () => {
					const { controller, service, sendEmail } = createNotifyContext(reportQuestion, {
						previous: { status, isSound: 'sound' }
					});

					await controller.prepareAndSave({ ...issueReport });

					assert.strictEqual(service.db.examinationInfo.upsert.mock.callCount(), 1);
					assert.deepStrictEqual(sentEmails(sendEmail), []);
				});
			}

			for (const isSound of [null, '', 'unknown']) {
				it(`logs a warning and does not send any email when the report is issued with plan outcome ${JSON.stringify(isSound)}`, async () => {
					const { controller, service, sendEmail } = createNotifyContext(reportQuestion, {
						previous: { status: EXAMINATION_STATUS_ID.IN_EXAMINATION, isSound }
					});

					const result = await controller.prepareAndSave({ ...issueReport });

					assert.deepStrictEqual(result, { dataWritten: true, writtenToDB: true });
					assert.deepStrictEqual(sentEmails(sendEmail), []);
					assert.strictEqual(service.logger.warn.mock.callCount(), 1);
					assert.match(service.logger.warn.mock.calls[0].arguments[1], /no outcome email was sent/);
				});
			}

			it('does not send any email for a status change other than the report being issued', async () => {
				const { controller, sendEmail } = createNotifyContext('miqs', {
					previous: { status: EXAMINATION_STATUS_ID.SUBMITTED, isSound: 'sound' }
				});

				await controller.prepareAndSave({ status: EXAMINATION_STATUS_ID.IN_EXAMINATION });

				assert.deepStrictEqual(sentEmails(sendEmail), []);
			});

			it('does not send any email when the database save fails', async () => {
				const { controller, service, sendEmail } = createNotifyContext(reportQuestion, {
					previous: { status: EXAMINATION_STATUS_ID.IN_EXAMINATION, isSound: 'sound' }
				});
				service.db.examinationInfo.upsert.mock.mockImplementation(async () => {
					throw new Error('Save failed');
				});

				await assert.rejects(controller.prepareAndSave({ ...issueReport }), /Save failed/);
				assert.deepStrictEqual(sentEmails(sendEmail), []);
			});

			it('still reports a successful save when Notify rejects the email', async () => {
				const { controller, service, sendEmail } = createNotifyContext(reportQuestion, {
					previous: { status: EXAMINATION_STATUS_ID.IN_EXAMINATION, isSound: 'unsound' }
				});
				sendEmail.mock.mockImplementation(async () => {
					throw new Error('Notify unavailable');
				});

				const result = await controller.prepareAndSave({ ...issueReport });

				assert.deepStrictEqual(result, { dataWritten: true, writtenToDB: true });
				assert.strictEqual(sendEmail.mock.callCount(), 1);
				assert.strictEqual(service.logger.error.mock.callCount(), 1);
				assert.strictEqual(service.logger.error.mock.calls[0].arguments[0].email, 'lpa@example.com');
			});

			it('still reports a successful save when the notification config is missing', async () => {
				delete process.env.PORTAL_URL;
				const { controller, service, sendEmail } = createNotifyContext(reportQuestion, {
					previous: { status: EXAMINATION_STATUS_ID.IN_EXAMINATION, isSound: 'sound' }
				});

				const result = await controller.prepareAndSave({ ...issueReport });

				assert.deepStrictEqual(result, { dataWritten: true, writtenToDB: true });
				assert.deepStrictEqual(sentEmails(sendEmail), []);
				assert.strictEqual(service.logger.error.mock.calls[0].arguments[1], 'Failed to send examination notify email');
			});
		});

		it('does not send any email for a field without a notification', async () => {
			const { controller, service, sendEmail } = createNotifyContext('examination-expected-date');

			const result = await controller.prepareAndSave({ examinationExpectedDate: new Date('2026-02-01') });

			assert.deepStrictEqual(result, { dataWritten: true, writtenToDB: true });
			assert.strictEqual(service.db.examinationInfo.upsert.mock.callCount(), 1);
			assert.deepStrictEqual(sentEmails(sendEmail), []);
		});

		it('does not send any email when saving the Programme officer', async () => {
			const { controller, service, sendEmail } = createNotifyContext('programme-officer');

			await controller.prepareAndSave({
				programmeOfficerFirstName: 'Jane',
				programmeOfficerLastName: 'Officer',
				programmeOfficerEmail: 'jane@example.com',
				isSound: 'sound'
			});

			assert.strictEqual(service.db.gateway3Info.upsert.mock.callCount(), 1);
			assert.deepStrictEqual(sentEmails(sendEmail), []);
		});
	});

	describe('should save to session', async () => {
		it('rejects when there are no case details', async () => {
			const mockService = createMockService();
			mockService.db.case.findUnique = mock.fn(async () => null);
			const req = {
				params: {}
			} as Request;
			const examinationController = new ExamSaveControllerWrapper(
				mockService as unknown as ManageService,
				req,
				'caseRef'
			);
			await assert.rejects(examinationController.wrapShouldSaveToSession());
		});
		it('returns false when pauses is undefined', async () => {
			const mockService = createMockService();
			mockService.db.case.findUnique = mock.fn(async () => ({
				id: 'someCaseId',
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
					planPauseHistory: undefined
				}
			}));
			const req = {
				params: {}
			} as Request;
			const examinationController = new ExamSaveControllerWrapper(
				mockService as unknown as ManageService,
				req,
				'caseRef'
			);
		});
		it('returns false when attempting to modify the second pause question', async () => {
			const question = 'examination-pause-details-3';
			const mockService = createMockService();
			mockService.db.case.findUnique = mock.fn(async () => ({
				id: 'someCaseId',
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
					planPauseHistory: [
						{
							startTime: new Date(),
							planPauseStartDetails: 'The first pause'
						},
						{
							startTime: new Date(),
							planPauseStartDetails: 'The third pause' // Deliberately out of order, should be sorted
						},
						{
							startTime: new Date(),
							planPauseStartDetails: 'The second pause' // Deliberately out of order, should be sorted
						}
					]
				}
			}));
			const req = {
				params: {}
			} as Request;
			req.params.question = question;
			const examinationController = new ExamSaveControllerWrapper(
				mockService as unknown as ManageService,
				req,
				'caseRef'
			);
			const result = await examinationController.wrapShouldSaveToSession();
			assert.equal(result, false);
		});
		it('returns false when attempting to modify the first pause question with no existing data', async () => {
			const question = 'examination-pause-start-date-3';
			const mockService = createMockService();
			mockService.db.case.findUnique = mock.fn(async () => ({
				id: 'someCaseId',
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
					planPauseHistory: [
						{
							startTime: new Date(),
							planPauseStartDetails: 'The first pause'
						},
						{
							startTime: new Date(),
							planPauseStartDetails: 'The second pause'
						}
					]
				}
			}));
			const req = {
				params: {}
			} as Request;
			req.params.question = question;
			const examinationController = new ExamSaveControllerWrapper(
				mockService as unknown as ManageService,
				req,
				'caseRef'
			);
			const result = await examinationController.wrapShouldSaveToSession();
			assert.equal(result, true);
		});
		it('returns true when attempting to modify the first pause question with existing data', async () => {
			const question = 'examination-pause-start-date-2';
			const mockService = createMockService();
			mockService.db.case.findUnique = mock.fn(async () => ({
				id: 'someCaseId',
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
					planPauseHistory: [
						{
							startTime: new Date(),
							planPauseStartDetails: 'The first pause'
						},
						{
							startTime: new Date(),
							planPauseStartDetails: 'The second pause'
						}
					]
				}
			}));
			const req = {
				params: {}
			} as Request;
			req.params.question = question;
			const examinationController = new ExamSaveControllerWrapper(
				mockService as unknown as ManageService,
				req,
				'caseRef'
			);
			const result = await examinationController.wrapShouldSaveToSession();
			assert.equal(result, false);
		});
	});
	describe('prepareData', async () => {
		it('can prepare pause data for the pause start date question', async () => {
			const question = 'examination-pause-start-date-1';
			const mockService = createMockService();
			const req = {
				params: {},
				url: `some/url/${question}`
			} as Request;
			req.params.question = question;
			const examinationController = new ExamSaveControllerWrapper(
				mockService as unknown as ManageService,
				req,
				'caseRef'
			);
			const answers = {
				'planPauseDate-1': new Date(2026, 2, 1),
				'planPauseStartDetails-1': 'some details'
			};
			const expectedOutput = {
				planPauseHistory: [
					{
						createdAt: new Date(2026, 0, 1),
						planPauseEndDate: new Date(2026, 0, 5),
						planPauseDate: new Date(2026, 2, 1)
					},
					{
						createdAt: new Date(2026, 5, 1),
						planPauseDate: new Date(2026, 5, 2),
						planPauseEndDate: new Date(2026, 5, 3)
					}
				]
			};
			const actualOutput = await examinationController.wrapPrepareData(answers);
			assert.deepEqual(actualOutput, expectedOutput);
		});
		it('can prepare pause data for the pause details question', async () => {
			const question = 'examination-pause-details-1';
			const mockService = createMockService();
			const req = {
				params: {},
				url: `some/url/${question}`
			} as Request;
			req.params.question = question;
			const examinationController = new ExamSaveControllerWrapper(
				mockService as unknown as ManageService,
				req,
				'caseRef'
			);
			const answers = {
				'planPauseDate-1': new Date(2026, 2, 1),
				'planPauseStartDetails-1': 'some details'
			};
			const expectedOutput = {
				planPauseHistory: [
					{
						createdAt: new Date(2026, 0, 1),
						planPauseEndDate: new Date(2026, 0, 5),
						planPauseDate: new Date(2026, 0, 2),
						planPauseStartDetails: 'some details'
					},
					{
						createdAt: new Date(2026, 5, 1),
						planPauseDate: new Date(2026, 5, 2),
						planPauseEndDate: new Date(2026, 5, 3)
					}
				]
			};
			const actualOutput = await examinationController.wrapPrepareData(answers);
			assert.deepEqual(actualOutput, expectedOutput);
		});
		it('can prepare pause data for the pause end date question', async () => {
			const question = 'examination-pause-end-date-1';
			const mockService = createMockService();
			const req = {
				params: {},
				url: `some/url/${question}`
			} as Request;
			req.params.question = question;
			const examinationController = new ExamSaveControllerWrapper(
				mockService as unknown as ManageService,
				req,
				'caseRef'
			);
			const answers = {
				'planPauseDate-1': new Date(2026, 2, 1),
				'planPauseStartDetails-1': 'some details',
				'planPauseEndDate-1': new Date(2026, 5, 2)
			};
			const expectedOutput = {
				planPauseHistory: [
					{
						createdAt: new Date(2026, 0, 1),
						planPauseEndDate: new Date(2026, 5, 2),
						planPauseDate: new Date(2026, 0, 2)
					},
					{
						createdAt: new Date(2026, 5, 1),
						planPauseDate: new Date(2026, 5, 2),
						planPauseEndDate: new Date(2026, 5, 3)
					}
				]
			};
			const actualOutput = await examinationController.wrapPrepareData(answers);
			assert.deepEqual(actualOutput, expectedOutput);
		});
		it('can prepare pause data for the pause start date question when the pause id is greater than the number of pauses', async () => {
			const question = 'examination-pause-start-date-3';
			const mockService = createMockService();
			const req = {
				params: {},
				url: `some/url/${question}`
			} as Request;
			req.params.question = question;
			const examinationController = new ExamSaveControllerWrapper(
				mockService as unknown as ManageService,
				req,
				'caseRef'
			);
			const answers = {
				'planPauseDate-3': new Date(2026, 2, 1)
			};
			const actualOutput = await examinationController.wrapPrepareData(answers);
			assert.equal(actualOutput.planPauseHistory.length, 3);
			const pause = actualOutput.planPauseHistory.at(2);
			assert.notEqual(pause, undefined);
			assert.deepEqual((pause as any).planPauseDate, new Date(2026, 2, 1));
		});
		it('rejects when the pause data is invalid', async () => {
			const question = 'examination-pause-end-date-1';
			const mockService = createMockService();
			const req = {
				params: {},
				url: `some/url/${question}`
			} as Request;
			req.params.question = question;
			const examinationController = new ExamSaveControllerWrapper(
				mockService as unknown as ManageService,
				req,
				'caseRef'
			);
			const answers = {
				'planPauseEndDate-1': null // Set clear the planPauseEndDate for the first pause, when there are two pauses already
			};
			// All pauses MUST have an planPauseEndDate set except for the last pause
			await assert.rejects(examinationController.wrapPrepareData(answers));
		});
	});
	describe('saveToSession', async () => {
		it('rejects when there is no pause id in the question', async () => {
			const question = 'examination-pause-end-date';
			const mockService = createMockService();
			const req = {
				params: {},
				url: `some/url/${question}`,
				session: {}
			} as Request;
			req.params.question = question;
			const examinationController = new ExamSaveControllerWrapper(
				mockService as unknown as ManageService,
				req,
				'caseRef'
			);
			await assert.rejects(examinationController.wrapSaveToSession({}));
		});
		it('rejects when there is no session data', async () => {
			const question = 'examination-pause-end-date-1';
			const mockService = createMockService();
			const req = {
				params: {},
				url: `some/url/${question}`
			} as Request;
			req.params.question = question;
			const examinationController = new ExamSaveControllerWrapper(
				mockService as unknown as ManageService,
				req,
				'caseRef'
			);
			await assert.rejects(examinationController.wrapSaveToSession({}));
		});
		it('can add new answers to the session when there are no existing answers', async () => {
			const question = 'examination-pause-end-date-1';
			const mockService = createMockService();
			const req = {
				params: {},
				url: `some/url/${question}`,
				session: {}
			} as Request;
			req.params.question = question;
			const examinationController = new ExamSaveControllerWrapper(
				mockService as unknown as ManageService,
				req,
				'caseRef'
			);
			const answers = {
				planPauseHistory: [
					{
						createdAt: new Date(2026, 0, 1),
						planPauseEndDate: new Date(2026, 5, 2),
						planPauseDate: new Date(2026, 0, 2)
					},
					{
						createdAt: new Date(2026, 5, 1),
						planPauseDate: new Date(2026, 5, 2)
					}
				]
			};
			await examinationController.wrapSaveToSession(answers);
			assert.deepEqual(req.session.answers, answers);
		});
		it('can add new answers to the session when there are existing answers', async () => {
			const question = 'examination-pause-end-date-1';
			const mockService = createMockService();
			const req = {
				params: {},
				url: `some/url/${question}`,
				session: {}
			} as Request;
			req.session.answers = {
				planPauseHistory: [
					{
						createdAt: undefined,
						planPauseEndDate: undefined,
						planPauseDate: undefined
					},
					{
						createdAt: new Date(2026, 5, 1),
						planPauseDate: new Date(2026, 5, 2),
						planPauseStartDetails: 'old details' // Should not be overwritten
					}
				]
			};
			req.params.question = question;
			const examinationController = new ExamSaveControllerWrapper(
				mockService as unknown as ManageService,
				req,
				'caseRef'
			);
			const answers = {
				planPauseHistory: [
					{
						createdAt: new Date(2026, 0, 1),
						planPauseEndDate: new Date(2026, 5, 2),
						planPauseDate: new Date(2026, 0, 2),
						planPauseStartDetails: 'some details'
					},
					{
						createdAt: new Date(2026, 5, 1),
						planPauseDate: new Date(2026, 5, 2)
					}
				]
			};
			const expectedSessionAnswers = {
				planPauseHistory: [
					{
						createdAt: new Date(2026, 0, 1),
						planPauseEndDate: new Date(2026, 5, 2),
						planPauseDate: new Date(2026, 0, 2),
						planPauseStartDetails: 'some details'
					},
					{
						createdAt: new Date(2026, 5, 1),
						planPauseDate: new Date(2026, 5, 2),
						planPauseStartDetails: 'old details' // Should not be overwritten
					}
				]
			};
			await examinationController.wrapSaveToSession(answers);
			assert.deepEqual(req.session.answers, expectedSessionAnswers);
		});
	});
	describe('saveToDatabase', async () => {
		const question = 'examination-pause-end-date-1';
		const mockService = createMockService();
		const req = {
			params: {},
			url: `some/url/${question}`
		} as Request;
		req.params.question = question;
		const examinationController = new ExamSaveControllerWrapper(
			mockService as unknown as ManageService,
			req,
			'caseRef'
		);
		(examinationController as any).caseId = 'someCaseId';
		const answers = {
			planPauseHistory: [
				{
					createdAt: new Date(2026, 0, 1),
					planPauseStartDetails: 'new details 1',
					planPauseEndDate: new Date(2026, 5, 2),
					planPauseDate: new Date(2026, 0, 2)
				},
				{
					createdAt: new Date(2026, 5, 1),
					planPauseStartDetails: 'new details 2',
					planPauseDate: new Date(2026, 5, 2)
				}
			]
		};
		await examinationController.wrapSaveToDatabase(answers);
		assert.deepEqual(mockService.db.examinationInfo.upsert.mock.calls[0].arguments[0], {
			create: {
				caseId: 'someCaseId',
				planPauseHistory: {
					createMany: {
						data: [
							{
								createdAt: new Date(2026, 0, 1),
								planPauseStartDetails: 'new details 1',
								planPauseEndDate: new Date(2026, 5, 2),
								planPauseDate: new Date(2026, 0, 2),
								planPauseEndDetails: undefined
							},
							{
								createdAt: new Date(2026, 5, 1),
								planPauseStartDetails: 'new details 2',
								planPauseDate: new Date(2026, 5, 2),
								planPauseEndDate: undefined,
								planPauseEndDetails: undefined
							}
						]
					}
				}
			},
			update: {
				planPauseHistory: {
					createMany: {
						data: [
							{
								createdAt: new Date(2026, 0, 1),
								planPauseStartDetails: 'new details 1',
								planPauseEndDate: new Date(2026, 5, 2),
								planPauseDate: new Date(2026, 0, 2),
								planPauseEndDetails: undefined
							},
							{
								createdAt: new Date(2026, 5, 1),
								planPauseStartDetails: 'new details 2',
								planPauseDate: new Date(2026, 5, 2),
								planPauseEndDate: undefined,
								planPauseEndDetails: undefined
							}
						]
					},
					deleteMany: {}
				}
			},
			where: {
				caseId: 'someCaseId'
			}
		});
	});
	describe('validatePauses', async () => {
		const question = 'examination-pause-end-date-1';
		const mockService = createMockService();
		const req = {
			params: {},
			url: `some/url/${question}`
		} as Request;
		req.params.question = question;
		const examinationController = new ExamSaveControllerWrapper(
			mockService as unknown as ManageService,
			req,
			'caseRef'
		);
		it('returns true for an empty pause list', () => {
			const pauses: PlanPauseHistory[] = [];
			const validationResult = examinationController.wrapValidatePauses(pauses);
			assert.equal(validationResult, true);
		});
		it('returns true when all pauses have planPauseEndDate specified', () => {
			const pauses: PlanPauseHistory[] = [
				{
					id: '1',
					createdAt: new Date(2026, 0, 1),
					planPauseStartDetails: 'new details 1',
					planPauseEndDate: new Date(2026, 5, 2),
					planPauseEndDetails: null,
					planPauseDate: new Date(2026, 0, 2),
					examinationInfoId: ''
				},
				{
					id: '2',
					createdAt: new Date(2026, 5, 1),
					planPauseStartDetails: 'new details 2',
					planPauseDate: new Date(2026, 5, 2),
					planPauseEndDate: new Date(2026, 5, 3),
					planPauseEndDetails: null,
					examinationInfoId: ''
				}
			];
			const validationResult = examinationController.wrapValidatePauses(pauses);
			assert.equal(validationResult, true);
		});
		it('returns true when all pauses have planPauseEndDate specified except for the last element', () => {
			const pauses: PlanPauseHistory[] = [
				{
					id: '1',
					createdAt: new Date(2026, 0, 1),
					planPauseStartDetails: 'new details 1',
					planPauseEndDate: new Date(2026, 5, 2),
					planPauseDate: new Date(2026, 0, 2),
					planPauseEndDetails: null,
					examinationInfoId: ''
				},
				{
					id: '2',
					createdAt: new Date(2026, 5, 1),
					planPauseStartDetails: 'new details 2',
					planPauseDate: new Date(2026, 5, 2),
					planPauseEndDate: null,
					planPauseEndDetails: null,
					examinationInfoId: ''
				}
			];
			const validationResult = examinationController.wrapValidatePauses(pauses);
			assert.equal(validationResult, true);
		});
		it('returns false when one element in the middle of the pause list has planPauseEndDate not specified', () => {
			const pauses: PlanPauseHistory[] = [
				{
					id: '1',
					createdAt: new Date(2026, 0, 1),
					planPauseStartDetails: 'new details 1',
					planPauseEndDate: null,
					planPauseEndDetails: null,
					planPauseDate: new Date(2026, 0, 2),
					examinationInfoId: ''
				},
				{
					id: '2',
					createdAt: new Date(2026, 5, 1),
					planPauseStartDetails: 'new details 2',
					planPauseDate: new Date(2026, 5, 2),
					planPauseEndDate: new Date(2026, 5, 3),
					planPauseEndDetails: null,
					examinationInfoId: ''
				}
			];
			const validationResult = examinationController.wrapValidatePauses(pauses);
			assert.equal(validationResult, false);
		});
	});
	it('rejects when a case could not be found', async () => {
		const mockService = createMockService();
		const question = '';
		mockService.db.case.findUnique = mock.fn(async () => undefined);
		const req = {
			params: {}
		} as Request;
		req.params.question = question;
		const answers = {};
		const examinationController = new ExaminationSaveController(
			mockService as unknown as ManageService,
			req,
			'caseRef'
		);
		await assert.rejects(examinationController.prepareAndSave(answers));
	});
	it('rejects when there are no hearings', async () => {
		const mockService = createMockService();
		mockService.db.case.findUnique = mock.fn(async () => ({
			id: 'someCaseId',
			gateway2Info: {
				workshops: [{}]
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
			examinationInfo: {} // Hearings is missing
		}));
		const req = {
			params: {}
		} as Request;
		const answers = {};
		const question = '';
		req.params.question = question;
		const examinationController = new ExaminationSaveController(
			mockService as unknown as ManageService,
			req,
			'caseRef'
		);
		await assert.rejects(examinationController.prepareAndSave(answers));
	});
	it('rejects when the current hearing id could not be found', async () => {
		const mockService = createMockService();
		mockService.db.case.findUnique = mock.fn(async () => ({
			id: 'someCaseId',
			gateway2Info: {
				workshops: [{}]
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
				hearings: [
					{
						id: 'someHearing'
					}
				]
			}
		}));
		const req = {
			params: {},
			url: '/check-your-answers'
		} as Request;
		const answers = {};
		const question = 'examination-hearing-date-and-time';
		req.params.question = question;
		const examinationController = new ExaminationSaveController(
			mockService as unknown as ManageService,
			req,
			'caseRef'
		);
		await assert.rejects(examinationController.prepareAndSave(answers));
	});
	it('can save the hearing field to the session with no existing session data', async () => {
		const hearingId = 1;
		const mockService = createMockService();
		mockService.db.case.findUnique = mock.fn(async () => ({
			id: 'someCaseId',
			gateway2Info: {
				workshops: [{}]
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
				hearings: [
					{
						id: 'someHearing'
					}
				]
			}
		}));
		const question = `examination-hearing-location-type-${hearingId}`;
		const req = {
			params: {
				question: question
			},
			session: {},
			url: question
		} as Request<any, any, any, any, Record<string, any>>;
		req.params.question = question;
		const answers = {
			[`hearingLocationType-${hearingId}`]: 'a'
		};
		const examinationController = new ExaminationSaveController(
			mockService as unknown as ManageService,
			req,
			'caseRef'
		);
		await examinationController.prepareAndSave(answers);
		assert.equal(mockService.db.examinationInfo.upsert.mock.calls.length, 0);
		const expectedSession = {
			answers: {
				hearings: [
					{
						id: 'someHearing',
						hearingLocationType: 'a'
					}
				]
			}
		};
		assert.deepEqual(req.session, expectedSession);
	});
	it('can save the hearing field to the session with existing session data', async () => {
		const hearingId = 1;
		const mockService = createMockService();
		mockService.db.case.findUnique = mock.fn(async () => ({
			id: 'someCaseId',
			gateway2Info: {
				workshops: [{}]
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
				hearings: [
					{
						id: 'someHearing'
					}
				]
			}
		}));
		const question = `examination-hearing-location-type-${hearingId}`;
		const req = {
			params: {
				question: question
			},
			session: {
				answers: {
					hearings: [
						{
							hearingDate: '01/01/2026',
							hearingTime: '00:00',
							hearingExpectedDaysKnown: true,
							hearingExpectedDays: 2, // Radio button with nested field
							hearingRemoteMeetingLinkKnown: true,
							hearingRemoteMeetingLink: 'b',
							hearingLocationKnown: true,
							hearingVenueName: 'c',
							hearingAddressLine: 'd',
							hearingAddressLine2: 'e',
							hearingTownOrCity: 'f',
							hearingPostcode: 'g'
						}
					]
				}
			},
			url: question
		} as unknown as Request<any, any, any, any, Record<string, any>>;
		req.params.question = question;
		const answers = {
			[`hearingDate-${hearingId}`]: '01/01/2026',
			[`hearingTime-${hearingId}`]: '00:00',
			[`hearingExpectedDaysKnown-${hearingId}`]: true,
			[`hearingExpectedDaysKnown-${hearingId}_hearingExpectedDays`]: 2, // Radio button with nested field
			[`hearingLocationType-${hearingId}`]: 'a',
			[`hearingRemoteMeetingLinkKnown-${hearingId}`]: true,
			[`hearingRemoteMeetingLink-${hearingId}`]: 'b',
			[`hearingLocationKnown-${hearingId}`]: true,
			[`hearingVenueName-${hearingId}`]: 'c',
			[`hearingAddressLine-${hearingId}`]: 'd',
			[`hearingAddressLine2-${hearingId}`]: 'e',
			[`hearingTownOrCity-${hearingId}`]: 'f',
			[`hearingPostcode-${hearingId}`]: 'g'
		};
		const examinationController = new ExaminationSaveController(
			mockService as unknown as ManageService,
			req,
			'caseRef'
		);
		await examinationController.prepareAndSave(answers);
		assert.equal(mockService.db.examinationInfo.upsert.mock.calls.length, 0);
		const expectedSession = {
			answers: {
				hearings: [
					{
						id: 'someHearing',
						hearingDate: '01/01/2026',
						hearingTime: '00:00',
						hearingExpectedDaysKnown: true,
						hearingExpectedDays: 2, // Radio button with nested field
						hearingLocationType: 'a',
						hearingRemoteMeetingLinkKnown: true,
						hearingRemoteMeetingLink: 'b',
						hearingLocationKnown: true,
						hearingVenueName: 'c',
						hearingAddressLine: 'd',
						hearingAddressLine2: 'e',
						hearingTownOrCity: 'f',
						hearingPostcode: 'g'
					}
				]
			}
		};
		assert.deepEqual(req.session, expectedSession);
	});
	it('can save the hearing field to the database', async () => {
		const hearingId = 1;
		const mockService = createMockService();
		mockService.db.case.findUnique = mock.fn(async () => ({
			id: 'someCaseId',
			gateway2Info: {
				workshops: [{}]
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
				hearings: [
					{
						id: 'someHearing'
					}
				]
			}
		}));
		const question = undefined;
		const req = {
			params: {
				question: question
			},
			url: `/check-your-answers-${hearingId}`
		} as Request<any, any, any, any, Record<string, any>>;
		req.params.question = question;
		const answers = {
			[`hearingDate-${hearingId}`]: '01/01/2026',
			[`hearingTime-${hearingId}`]: '00:00',
			[`hearingExpectedDaysKnown-${hearingId}`]: true,
			[`hearingExpectedDaysKnown-${hearingId}_hearingExpectedDays`]: 2, // Radio button with nested field
			[`hearingLocationType-${hearingId}`]: 'a',
			[`hearingRemoteMeetingLinkKnown-${hearingId}`]: true,
			[`hearingRemoteMeetingLink-${hearingId}`]: 'b',
			[`hearingLocationKnown-${hearingId}`]: true,
			[`hearingVenueName-${hearingId}`]: 'c',
			[`hearingAddressLine-${hearingId}`]: 'd',
			[`hearingAddressLine2-${hearingId}`]: 'e',
			[`hearingTownOrCity-${hearingId}`]: 'f',
			[`hearingPostcode-${hearingId}`]: 'g'
		};
		const expectedQuery = {
			create: {
				caseId: 'someCaseId',
				hearings: {
					createMany: {
						data: [
							{
								id: 'someHearing',
								createdDate: undefined,
								hearingRemoteMeetingLink: 'b',
								hearingRemoteMeetingLinkKnown: true,
								hearingAddressLine2: 'e',
								hearingAddressLine: 'd',
								hearingDate: mockDate,
								hearingDuration: undefined,
								hearingEndDate: undefined,
								hearingExpectedDays: 2,
								hearingExpectedDaysKnown: true,
								hearingLocationKnown: true,
								hearingLocationType: 'a',
								hearingPostcode: 'g',
								hearingTime: '00:00',
								hearingTownOrCity: 'f',
								hearingVenueName: 'c'
							}
						]
					}
				}
			},
			update: {
				hearings: {
					createMany: {
						data: [
							{
								id: 'someHearing',
								createdDate: undefined,
								hearingRemoteMeetingLink: 'b',
								hearingRemoteMeetingLinkKnown: true,
								hearingAddressLine2: 'e',
								hearingAddressLine: 'd',
								hearingDate: mockDate,
								hearingDuration: undefined,
								hearingEndDate: undefined,
								hearingExpectedDays: 2,
								hearingExpectedDaysKnown: true,
								hearingLocationKnown: true,
								hearingLocationType: 'a',
								hearingPostcode: 'g',
								hearingTime: '00:00',
								hearingTownOrCity: 'f',
								hearingVenueName: 'c'
							}
						]
					},
					deleteMany: {}
				}
			},
			where: {
				caseId: 'someCaseId'
			}
		};
		const examinationController = new ExaminationSaveController(
			mockService as unknown as ManageService,
			req,
			'caseRef'
		);
		await examinationController.prepareAndSave(answers);
		assert.deepEqual(mockService.db.examinationInfo.upsert.mock.calls[0].arguments.at(0), expectedQuery);
	});
	it('can save a non-hearing field with an assessor question to the database', async () => {
		const mockService = createMockService();
		const question = '';
		mockService.db.case.findUnique = mock.fn(async () => undefined);
		const req = {
			params: {}
		} as Request;
		req.params.question = question;
		const answers = {};
		const examinationController = new ExaminationSaveController(
			mockService as unknown as ManageService,
			req,
			'caseRef'
		);
		await assert.rejects(examinationController.prepareAndSave(answers));
	});
	it('rejects when there are no hearings', async () => {
		const mockService = createMockService();
		mockService.db.case.findUnique = mock.fn(async () => ({
			id: 'someCaseId',
			gateway2Info: {
				workshops: [{}]
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
			examinationInfo: {} // Hearings is missing
		}));
		const req = {
			params: {}
		} as Request;
		const answers = {};
		const question = '';
		req.params.question = question;
		const examinationController = new ExaminationSaveController(
			mockService as unknown as ManageService,
			req,
			'caseRef'
		);
		await assert.rejects(examinationController.prepareAndSave(answers));
	});
	it('rejects when the current hearing id could not be found', async () => {
		const mockService = createMockService();
		mockService.db.case.findUnique = mock.fn(async () => ({
			id: 'someCaseId',
			gateway2Info: {
				workshops: [{}]
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
				hearings: [
					{
						id: 'someHearing'
					}
				]
			}
		}));
		const req = {
			params: {},
			url: '/check-your-answers'
		} as Request;
		const answers = {};
		const question = 'examination-hearing-date-and-time';
		req.params.question = question;
		const examinationController = new ExaminationSaveController(
			mockService as unknown as ManageService,
			req,
			'caseRef'
		);
		await assert.rejects(examinationController.prepareAndSave(answers));
	});
	it('can save the hearing field to the session with no existing session data', async () => {
		const hearingId = 1;
		const mockService = createMockService();
		mockService.db.case.findUnique = mock.fn(async () => ({
			id: 'someCaseId',
			gateway2Info: {
				workshops: [{}]
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
				hearings: [
					{
						id: 'someHearing'
					}
				]
			}
		}));
		const question = `examination-hearing-location-type-${hearingId}`;
		const req = {
			params: {
				question: question
			},
			session: {},
			url: question
		} as Request<any, any, any, any, Record<string, any>>;
		req.params.question = question;
		const answers = {
			[`hearingLocationType-${hearingId}`]: 'a'
		};
		const examinationController = new ExaminationSaveController(
			mockService as unknown as ManageService,
			req,
			'caseRef'
		);
		await examinationController.prepareAndSave(answers);
		assert.equal(mockService.db.examinationInfo.upsert.mock.calls.length, 0);
		const expectedSession = {
			answers: {
				hearings: [
					{
						id: 'someHearing',
						hearingLocationType: 'a'
					}
				]
			}
		};
		assert.deepEqual(req.session, expectedSession);
	});
	it('can save the hearing field to the session with existing session data', async () => {
		const hearingId = 1;
		const mockService = createMockService();
		mockService.db.case.findUnique = mock.fn(async () => ({
			id: 'someCaseId',
			gateway2Info: {
				workshops: [{}]
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
				hearings: [
					{
						id: 'someHearing'
					}
				]
			}
		}));
		const question = `examination-hearing-location-type-${hearingId}`;
		const req = {
			params: {
				question: question
			},
			session: {
				answers: {
					hearings: [
						{
							hearingDate: '01/01/2026',
							hearingTime: '00:00',
							hearingExpectedDaysKnown: true,
							hearingExpectedDays: 2, // Radio button with nested field
							hearingRemoteMeetingLinkKnown: true,
							hearingRemoteMeetingLink: 'b',
							hearingLocationKnown: true,
							hearingVenueName: 'c',
							hearingAddressLine: 'd',
							hearingAddressLine2: 'e',
							hearingTownOrCity: 'f',
							hearingPostcode: 'g'
						}
					]
				}
			},
			url: question
		} as unknown as Request<any, any, any, any, Record<string, any>>;
		req.params.question = question;
		const answers = {
			[`hearingDate-${hearingId}`]: '01/01/2026',
			[`hearingTime-${hearingId}`]: '00:00',
			[`hearingExpectedDaysKnown-${hearingId}`]: true,
			[`hearingExpectedDaysKnown-${hearingId}_hearingExpectedDays`]: 2, // Radio button with nested field
			[`hearingLocationType-${hearingId}`]: 'a',
			[`hearingRemoteMeetingLinkKnown-${hearingId}`]: true,
			[`hearingRemoteMeetingLink-${hearingId}`]: 'b',
			[`hearingLocationKnown-${hearingId}`]: true,
			[`hearingVenueName-${hearingId}`]: 'c',
			[`hearingAddressLine-${hearingId}`]: 'd',
			[`hearingAddressLine2-${hearingId}`]: 'e',
			[`hearingTownOrCity-${hearingId}`]: 'f',
			[`hearingPostcode-${hearingId}`]: 'g'
		};
		const examinationController = new ExaminationSaveController(
			mockService as unknown as ManageService,
			req,
			'caseRef'
		);
		await examinationController.prepareAndSave(answers);
		assert.equal(mockService.db.examinationInfo.upsert.mock.calls.length, 0);
		const expectedSession = {
			answers: {
				hearings: [
					{
						id: 'someHearing',
						hearingDate: '01/01/2026',
						hearingTime: '00:00',
						hearingExpectedDaysKnown: true,
						hearingExpectedDays: 2, // Radio button with nested field
						hearingLocationType: 'a',
						hearingRemoteMeetingLinkKnown: true,
						hearingRemoteMeetingLink: 'b',
						hearingLocationKnown: true,
						hearingVenueName: 'c',
						hearingAddressLine: 'd',
						hearingAddressLine2: 'e',
						hearingTownOrCity: 'f',
						hearingPostcode: 'g'
					}
				]
			}
		};
		assert.deepEqual(req.session, expectedSession);
	});
	it('can save the hearing field to the database', async () => {
		const hearingId = 1;
		const mockService = createMockService();
		mockService.db.case.findUnique = mock.fn(async () => ({
			id: 'someCaseId',
			gateway2Info: {
				workshops: [{}]
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
				hearings: [
					{
						id: 'someHearing'
					}
				]
			}
		}));
		const question = undefined;
		const req = {
			params: {
				question: question
			},
			url: `/check-your-answers-${hearingId}`
		} as Request<any, any, any, any, Record<string, any>>;
		req.params.question = question;
		const answers = {
			[`hearingDate-${hearingId}`]: '01/01/2026',
			[`hearingTime-${hearingId}`]: '00:00',
			[`hearingExpectedDaysKnown-${hearingId}`]: true,
			[`hearingExpectedDaysKnown-${hearingId}_hearingExpectedDays`]: 2, // Radio button with nested field
			[`hearingLocationType-${hearingId}`]: 'a',
			[`hearingRemoteMeetingLinkKnown-${hearingId}`]: true,
			[`hearingRemoteMeetingLink-${hearingId}`]: 'b',
			[`hearingLocationKnown-${hearingId}`]: true,
			[`hearingVenueName-${hearingId}`]: 'c',
			[`hearingAddressLine-${hearingId}`]: 'd',
			[`hearingAddressLine2-${hearingId}`]: 'e',
			[`hearingTownOrCity-${hearingId}`]: 'f',
			[`hearingPostcode-${hearingId}`]: 'g'
		};
		const expectedQuery = {
			create: {
				caseId: 'someCaseId',
				hearings: {
					createMany: {
						data: [
							{
								id: 'someHearing',
								createdDate: undefined,
								hearingRemoteMeetingLink: 'b',
								hearingRemoteMeetingLinkKnown: true,
								hearingAddressLine2: 'e',
								hearingAddressLine: 'd',
								hearingDate: mockDate,
								hearingDuration: undefined,
								hearingEndDate: undefined,
								hearingExpectedDays: 2,
								hearingExpectedDaysKnown: true,
								hearingLocationKnown: true,
								hearingLocationType: 'a',
								hearingPostcode: 'g',
								hearingTime: '00:00',
								hearingTownOrCity: 'f',
								hearingVenueName: 'c'
							}
						]
					}
				}
			},
			update: {
				hearings: {
					createMany: {
						data: [
							{
								id: 'someHearing',
								createdDate: undefined,
								hearingRemoteMeetingLink: 'b',
								hearingRemoteMeetingLinkKnown: true,
								hearingAddressLine2: 'e',
								hearingAddressLine: 'd',
								hearingDate: mockDate,
								hearingDuration: undefined,
								hearingEndDate: undefined,
								hearingExpectedDays: 2,
								hearingExpectedDaysKnown: true,
								hearingLocationKnown: true,
								hearingLocationType: 'a',
								hearingPostcode: 'g',
								hearingTime: '00:00',
								hearingTownOrCity: 'f',
								hearingVenueName: 'c'
							}
						]
					},
					deleteMany: {}
				}
			},
			where: {
				caseId: 'someCaseId'
			}
		};
		const examinationController = new ExaminationSaveController(
			mockService as unknown as ManageService,
			req,
			'caseRef'
		);
		await examinationController.prepareAndSave(answers);
		assert.deepEqual(mockService.db.examinationInfo.upsert.mock.calls[0].arguments.at(0), expectedQuery);
	});
});
