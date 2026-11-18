// @ts-nocheck

import { mockLogger } from '@planning-inspectorate/core/testing';
import assert from 'node:assert';
import { describe, it, mock } from 'node:test';
import { GovNotifyClient } from './gov-notify-client.ts';

type MockNotifyClient = {
	sendEmail: ReturnType<typeof mock.fn>;
	getNotificationById: ReturnType<typeof mock.fn>;
	getNotifications: ReturnType<typeof mock.fn>;
};

type TestableGovNotifyClient = GovNotifyClient & {
	notifyClient: MockNotifyClient;
};

function createMockNotifyClient(): MockNotifyClient {
	return {
		sendEmail: mock.fn(),
		getNotificationById: mock.fn(),
		getNotifications: mock.fn()
	};
}

function createTestClient(templateIds = { authCode: 'template-123' }) {
	const logger = mockLogger();
	const client = new GovNotifyClient(logger, 'test-api-key', templateIds) as TestableGovNotifyClient;
	const mockNotify = createMockNotifyClient();
	client.notifyClient = mockNotify;
	return { logger, client, mockNotify };
}

function notifyApiError(status: number, errors: { error: string; message: string }[]) {
	return Object.assign(new Error(`Request failed with status code ${status}`), {
		response: { status, data: { status_code: status, errors } }
	});
}

describe('GovNotifyClient', () => {
	describe('sendEmail', () => {
		it('should call notifyClient.sendEmail with correct arguments', async () => {
			const { logger, client, mockNotify } = createTestClient();
			mockNotify.sendEmail.mock.mockImplementation(async () => ({}));

			await client.sendEmail('template-123', 'test@example.com', {
				personalisation: { code: 'ABC' }
			});

			assert.strictEqual(mockNotify.sendEmail.mock.callCount(), 1);
			const [templateId, email, options] = mockNotify.sendEmail.mock.calls[0].arguments;
			assert.strictEqual(templateId, 'template-123');
			assert.strictEqual(email, 'test@example.com');
			assert.deepStrictEqual(options, { personalisation: { code: 'ABC' } });
			assert.strictEqual(logger.info.mock.callCount(), 1);
		});

		it('should throw and log when sendEmail fails', async () => {
			const originalError = new Error('API timeout');
			const { logger, client, mockNotify } = createTestClient();
			mockNotify.sendEmail.mock.mockImplementation(async () => {
				throw originalError;
			});

			await assert.rejects(
				() => client.sendEmail('template-123', 'test@example.com', { personalisation: {} }),
				(err) => {
					assert.match(err.message, /email failed to dispatch/);
					assert.strictEqual(err.cause, originalError);
					return true;
				}
			);

			assert.strictEqual(logger.error.mock.callCount(), 1);
			const logArgs = logger.error.mock.calls[0].arguments;
			assert.strictEqual(logArgs[0].templateId, 'template-123');
			assert.strictEqual(logArgs[0].error, originalError);
		});

		it('should log Notify API errors when present in response', async () => {
			const { logger, client, mockNotify } = createTestClient();
			const apiError = new Error('Bad request');
			(apiError as any).response = { data: { errors: [{ error: 'ValidationError', message: 'Invalid email' }] } };
			mockNotify.sendEmail.mock.mockImplementation(async () => {
				throw apiError;
			});

			await assert.rejects(() => client.sendEmail('template-123', 'bad-email', { personalisation: {} }));

			// should log both the main error and the Notify API errors
			assert.strictEqual(logger.error.mock.callCount(), 2);
			const notifyErrorLog = logger.error.mock.calls[1].arguments;
			assert.deepStrictEqual(notifyErrorLog[0].message, [{ error: 'ValidationError', message: 'Invalid email' }]);
		});

		it('logs the status and an actionable hint for a team-only API key rejection', async () => {
			const { logger, client, mockNotify } = createTestClient();
			const errors = [{ error: 'BadRequestError', message: "Can't send to this recipient using a team-only API key" }];
			mockNotify.sendEmail.mock.mockImplementation(async () => {
				throw notifyApiError(400, errors);
			});

			await assert.rejects(
				() => client.sendEmail('template-123', 'someone@example.com', { personalisation: {} }),
				/email failed to dispatch/
			);

			assert.strictEqual(mockNotify.sendEmail.mock.callCount(), 1);
			const [details, message] = logger.error.mock.calls[0].arguments;
			assert.strictEqual(message, 'failed to dispatch email');
			assert.strictEqual(details.status, 400);
			assert.match(details.hint, /team or guest list/);
			assert.deepStrictEqual(logger.error.mock.calls[1].arguments[0].message, errors);
		});

		// fail fast: nothing is retried, whatever the cause
		const failures = [
			[
				'a Notify 5xx',
				() => notifyApiError(500, [{ error: 'Exception', message: 'Internal server error' }]),
				/unavailable/i
			],
			[
				'a rate limit response',
				() => notifyApiError(429, [{ error: 'RateLimitError', message: 'Exceeded rate limit' }]),
				/rate limit/i
			],
			[
				'a network error',
				() => Object.assign(new Error('socket hang up'), { code: 'ECONNRESET' }),
				/could not reach gov\.uk notify/i
			]
		];
		for (const [name, makeError, hint] of failures) {
			it(`throws on the first failure without retrying for ${name}`, async () => {
				const { logger, client, mockNotify } = createTestClient();
				const error = makeError();
				mockNotify.sendEmail.mock.mockImplementation(async () => {
					throw error;
				});

				await assert.rejects(
					() => client.sendEmail('template-123', 'test@example.com', { personalisation: {} }),
					(err) => {
						assert.match(err.message, /email failed to dispatch/);
						assert.strictEqual(err.cause, error);
						return true;
					}
				);

				assert.strictEqual(mockNotify.sendEmail.mock.callCount(), 1);
				assert.strictEqual(logger.info.mock.callCount(), 1);
				assert.strictEqual(logger.warn.mock.callCount(), 0);
				assert.match(logger.error.mock.calls[0].arguments[0].hint, hint);
			});
		}
	});

	describe('sendAuthCode', () => {
		it('should call sendEmail with authCode template and reference', async () => {
			const { client, mockNotify } = createTestClient({ authCode: 'auth-template-id' });
			mockNotify.sendEmail.mock.mockImplementation(async () => ({}));

			await client.sendAuthCode(
				'user@example.com',
				{ authCode: 'XYZABC', expiryMinutes: '20' },
				'portal-login:PLAN-123456'
			);

			assert.strictEqual(mockNotify.sendEmail.mock.callCount(), 1);
			const [templateId, email, options] = mockNotify.sendEmail.mock.calls[0].arguments;
			assert.strictEqual(templateId, 'auth-template-id');
			assert.strictEqual(email, 'user@example.com');
			assert.deepStrictEqual(options, {
				personalisation: { authCode: 'XYZABC', expiryMinutes: '20' },
				reference: 'portal-login:PLAN-123456'
			});
		});

		for (const authCode of ['', undefined]) {
			it(`throws without calling Notify when the authCode template id is ${JSON.stringify(authCode)}`, async () => {
				const { logger, client, mockNotify } = createTestClient({ authCode });

				await assert.rejects(
					() => client.sendAuthCode('user@example.com', { authCode: 'XYZABC', expiryMinutes: '20' }),
					/email failed to dispatch: GOV_NOTIFY_AUTH_CODE_TEMPLATE_ID is not set/
				);

				assert.strictEqual(mockNotify.sendEmail.mock.callCount(), 0);
				assert.strictEqual(logger.error.mock.callCount(), 1);
				assert.match(logger.error.mock.calls[0].arguments[0], /GOV_NOTIFY_AUTH_CODE_TEMPLATE_ID is not set/);
			});
		}
	});

	describe('getNotificationById', () => {
		it('should return notification data on success', async () => {
			const { logger, client, mockNotify } = createTestClient();
			mockNotify.getNotificationById.mock.mockImplementation(async () => ({
				data: { id: 'notif-1', status: 'delivered' }
			}));

			const result = await client.getNotificationById('notif-1');

			assert.deepStrictEqual(result.data, { id: 'notif-1', status: 'delivered' });
			assert.strictEqual(mockNotify.getNotificationById.mock.calls[0].arguments[0], 'notif-1');
			assert.strictEqual(logger.info.mock.callCount(), 1);
		});

		it('should throw and log when getNotificationById fails', async () => {
			const originalError = new Error('Not found');
			const { logger, client, mockNotify } = createTestClient();
			mockNotify.getNotificationById.mock.mockImplementation(async () => {
				throw originalError;
			});

			await assert.rejects(
				() => client.getNotificationById('notif-999'),
				(err) => {
					assert.match(err.message, /failed to fetch notification/);
					assert.strictEqual(err.cause, originalError);
					return true;
				}
			);

			assert.strictEqual(logger.error.mock.callCount(), 1);
			const logArgs = logger.error.mock.calls[0].arguments;
			assert.strictEqual(logArgs[0].notificationId, 'notif-999');
		});
	});

	describe('getEmailNotificationsByReference', () => {
		it('should return email notifications for a reference', async () => {
			const { logger, client, mockNotify } = createTestClient();
			mockNotify.getNotifications.mock.mockImplementation(async () => ({
				data: {
					notifications: [{ id: 'notif-1', reference: 'create-case:PLAN-123456', status: 'delivered' }]
				}
			}));

			const result = await client.getEmailNotificationsByReference('create-case:PLAN-123456');

			assert.deepStrictEqual(result, [{ id: 'notif-1', reference: 'create-case:PLAN-123456', status: 'delivered' }]);
			assert.deepStrictEqual(mockNotify.getNotifications.mock.calls[0].arguments, [
				'email',
				undefined,
				'create-case:PLAN-123456'
			]);
			assert.strictEqual(logger.info.mock.callCount(), 1);
		});

		it('should throw and log when fetching email notifications fails', async () => {
			const originalError = new Error('Notify unavailable');
			const { logger, client, mockNotify } = createTestClient();
			mockNotify.getNotifications.mock.mockImplementation(async () => {
				throw originalError;
			});

			await assert.rejects(
				() => client.getEmailNotificationsByReference('create-case:PLAN-123456'),
				(err) => {
					assert.match(err.message, /failed to fetch email notifications/);
					assert.strictEqual(err.cause, originalError);
					return true;
				}
			);

			assert.strictEqual(logger.error.mock.callCount(), 1);
			const logArgs = logger.error.mock.calls[0].arguments;
			assert.strictEqual(logArgs[0].reference, 'create-case:PLAN-123456');
		});
	});
});
