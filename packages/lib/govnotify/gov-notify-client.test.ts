// @ts-nocheck

import { mockLogger } from '@planning-inspectorate/core/testing';
import assert from 'node:assert';
import { describe, it, mock } from 'node:test';
import { AxiosError, AxiosHeaders } from 'axios';
import { GovNotifyClient } from './gov-notify-client.ts';
import { NotifyError, NotifyErrorKind, NotifyErrorReason } from './notify-error.ts';

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

/** An error shaped like the one notifications-node-client (axios) throws when Notify responds with an error. */
function notifyApiError(status: number, errors: { error: string; message: string }[]) {
	const config = { headers: new AxiosHeaders() };
	return new AxiosError(`Request failed with status code ${status}`, 'ERR_BAD_REQUEST', config, undefined, {
		status,
		statusText: '',
		headers: {},
		config,
		data: { status_code: status, errors }
	});
}

/** An error shaped like the one axios throws when Notify could not be reached at all. */
function networkError(code: string) {
	return new AxiosError('socket hang up', code, { headers: new AxiosHeaders() });
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

		it('throws a NotifyError wrapping the original error when sendEmail fails', async () => {
			const originalError = new Error('API timeout');
			const { logger, client, mockNotify } = createTestClient();
			mockNotify.sendEmail.mock.mockImplementation(async () => {
				throw originalError;
			});

			await assert.rejects(
				() => client.sendEmail('template-123', 'test@example.com', { personalisation: {} }),
				(err) => {
					assert.ok(err instanceof NotifyError);
					assert.strictEqual(err.message, 'API timeout');
					assert.strictEqual(err.reason, NotifyErrorReason.UNKNOWN);
					assert.strictEqual(err.cause, originalError);
					return true;
				}
			);

			assert.strictEqual(logger.error.mock.callCount(), 1);
			const [details, message] = logger.error.mock.calls[0].arguments;
			assert.strictEqual(message, 'failed to dispatch email');
			assert.deepStrictEqual(details, {
				templateId: 'template-123',
				kind: 'Unknown',
				status: 0,
				reason: NotifyErrorReason.UNKNOWN,
				errors: [{ error: 'Unknown', message: 'API timeout' }]
			});
		});

		it('logs the Notify errors but not the raw error, which can carry request headers', async () => {
			const { logger, client, mockNotify } = createTestClient();
			const errors = [{ error: 'ValidationError', message: 'email_address Not a valid email address' }];
			mockNotify.sendEmail.mock.mockImplementation(async () => {
				throw notifyApiError(400, errors);
			});

			await assert.rejects(() => client.sendEmail('template-123', 'bad-email', { personalisation: {} }), NotifyError);

			assert.strictEqual(logger.error.mock.callCount(), 1);
			const [details] = logger.error.mock.calls[0].arguments;
			assert.deepStrictEqual(details.errors, errors);
			assert.strictEqual(details.kind, NotifyErrorKind.ValidationError);
			assert.strictEqual(details.reason, NotifyErrorReason.INVALID_RECIPIENT);
			assert.strictEqual('error' in details, false);
		});

		it('classifies a team-only API key rejection', async () => {
			const { logger, client, mockNotify } = createTestClient();
			const errors = [{ error: 'BadRequestError', message: "Can't send to this recipient using a team-only API key" }];
			const axiosError = notifyApiError(400, errors);
			mockNotify.sendEmail.mock.mockImplementation(async () => {
				throw axiosError;
			});

			await assert.rejects(
				() => client.sendEmail('template-123', 'someone@example.com', { personalisation: {} }),
				(err) => {
					assert.ok(err instanceof NotifyError);
					assert.strictEqual(err.status, 400);
					assert.strictEqual(err.kind, NotifyErrorKind.BadRequestError);
					assert.strictEqual(err.reason, NotifyErrorReason.TEAM_ONLY_KEY);
					assert.deepStrictEqual(err.errors, errors);
					assert.strictEqual(err.cause, axiosError);
					return true;
				}
			);

			assert.strictEqual(mockNotify.sendEmail.mock.callCount(), 1);
			const [details, message] = logger.error.mock.calls[0].arguments;
			assert.strictEqual(message, 'failed to dispatch email');
			assert.strictEqual(details.status, 400);
			assert.strictEqual(details.reason, NotifyErrorReason.TEAM_ONLY_KEY);
		});

		it('rethrows a NotifyError unchanged', async () => {
			const { client, mockNotify } = createTestClient();
			const notifyError = new NotifyError(400, [{ error: 'BadRequestError', message: 'Template not found' }]);
			mockNotify.sendEmail.mock.mockImplementation(async () => {
				throw notifyError;
			});

			await assert.rejects(
				() => client.sendEmail('template-123', 'test@example.com', { personalisation: {} }),
				(err) => err === notifyError
			);
		});

		// fail fast: nothing is retried, whatever the cause
		const failures = [
			[
				'a Notify 5xx',
				() => notifyApiError(500, [{ error: 'Exception', message: 'Internal server error' }]),
				500,
				NotifyErrorReason.SERVER_ERROR
			],
			[
				'a rate limit response',
				() => notifyApiError(429, [{ error: 'RateLimitError', message: 'Exceeded rate limit' }]),
				429,
				NotifyErrorReason.RATE_LIMIT
			],
			['a network error', () => networkError('ECONNRESET'), 0, NotifyErrorReason.NETWORK]
		];
		for (const [name, makeError, status, reason] of failures) {
			it(`throws on the first failure without retrying for ${name}`, async () => {
				const { logger, client, mockNotify } = createTestClient();
				const error = makeError();
				mockNotify.sendEmail.mock.mockImplementation(async () => {
					throw error;
				});

				await assert.rejects(
					() => client.sendEmail('template-123', 'test@example.com', { personalisation: {} }),
					(err) => {
						assert.ok(err instanceof NotifyError);
						assert.strictEqual(err.status, status);
						assert.strictEqual(err.reason, reason);
						assert.strictEqual(err.cause, error);
						return true;
					}
				);

				assert.strictEqual(mockNotify.sendEmail.mock.callCount(), 1);
				assert.strictEqual(logger.info.mock.callCount(), 1);
				assert.strictEqual(logger.warn.mock.callCount(), 0);
				assert.strictEqual(logger.error.mock.calls[0].arguments[0].reason, reason);
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

		it('should leave out the reference when none is given', async () => {
			const { client, mockNotify } = createTestClient({ authCode: 'auth-template-id' });
			mockNotify.sendEmail.mock.mockImplementation(async () => ({}));

			await client.sendAuthCode('user@example.com', { authCode: 'XYZABC', expiryMinutes: '20' });

			const [, , options] = mockNotify.sendEmail.mock.calls[0].arguments;
			assert.deepStrictEqual(options, { personalisation: { authCode: 'XYZABC', expiryMinutes: '20' } });
		});

		it('should propagate the NotifyError when Notify rejects the email', async () => {
			const { client, mockNotify } = createTestClient({ authCode: 'auth-template-id' });
			mockNotify.sendEmail.mock.mockImplementation(async () => {
				throw notifyApiError(400, [
					{ error: 'BadRequestError', message: "Can't send to this recipient when service is in trial mode" }
				]);
			});

			await assert.rejects(
				() => client.sendAuthCode('user@example.com', { authCode: 'XYZABC', expiryMinutes: '20' }),
				(err) => {
					assert.ok(err instanceof NotifyError);
					assert.strictEqual(err.reason, NotifyErrorReason.TRIAL_MODE);
					return true;
				}
			);
		});

		for (const authCode of ['', undefined]) {
			it(`throws without calling Notify when the authCode template id is ${JSON.stringify(authCode)}`, async () => {
				const { logger, client, mockNotify } = createTestClient({ authCode });

				await assert.rejects(
					() => client.sendAuthCode('user@example.com', { authCode: 'XYZABC', expiryMinutes: '20' }),
					(err) => {
						assert.strictEqual(err.message, 'Auth code template ID is not configured');
						// a configuration problem, not a response from Notify
						assert.strictEqual(err instanceof NotifyError, false);
						return true;
					}
				);

				assert.strictEqual(mockNotify.sendEmail.mock.callCount(), 0);
				assert.strictEqual(logger.error.mock.callCount(), 0);
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

		it('should throw a NotifyError and log when getNotificationById fails', async () => {
			const originalError = new Error('Not found');
			const { logger, client, mockNotify } = createTestClient();
			mockNotify.getNotificationById.mock.mockImplementation(async () => {
				throw originalError;
			});

			await assert.rejects(
				() => client.getNotificationById('notif-999'),
				(err) => {
					assert.ok(err instanceof NotifyError);
					assert.strictEqual(err.message, 'Not found');
					assert.strictEqual(err.cause, originalError);
					return true;
				}
			);

			assert.strictEqual(logger.error.mock.callCount(), 1);
			const logArgs = logger.error.mock.calls[0].arguments;
			assert.strictEqual(logArgs[0].notificationId, 'notif-999');
			assert.strictEqual(logArgs[1], 'failed to fetch notification by ID');
		});

		it('classifies a Notify 404 when the notification does not exist', async () => {
			const { client, mockNotify } = createTestClient();
			mockNotify.getNotificationById.mock.mockImplementation(async () => {
				throw notifyApiError(404, [{ error: 'NoResultFound', message: 'No result found' }]);
			});

			await assert.rejects(
				() => client.getNotificationById('notif-999'),
				(err) => {
					assert.ok(err instanceof NotifyError);
					assert.strictEqual(err.status, 404);
					assert.strictEqual(err.kind, NotifyErrorKind.NoResultFound);
					assert.strictEqual(err.reason, NotifyErrorReason.NOT_FOUND);
					return true;
				}
			);
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

		it('should throw a NotifyError and log when fetching email notifications fails', async () => {
			const originalError = new Error('Notify unavailable');
			const { logger, client, mockNotify } = createTestClient();
			mockNotify.getNotifications.mock.mockImplementation(async () => {
				throw originalError;
			});

			await assert.rejects(
				() => client.getEmailNotificationsByReference('create-case:PLAN-123456'),
				(err) => {
					assert.ok(err instanceof NotifyError);
					assert.strictEqual(err.message, 'Notify unavailable');
					assert.strictEqual(err.cause, originalError);
					return true;
				}
			);

			assert.strictEqual(logger.error.mock.callCount(), 1);
			const logArgs = logger.error.mock.calls[0].arguments;
			assert.strictEqual(logArgs[0].reference, 'create-case:PLAN-123456');
			assert.strictEqual(logArgs[1], 'failed to fetch email notifications by reference');
		});

		it('classifies a Notify server error when fetching email notifications', async () => {
			const { client, mockNotify } = createTestClient();
			mockNotify.getNotifications.mock.mockImplementation(async () => {
				throw notifyApiError(503, [{ error: 'Exception', message: 'Service unavailable' }]);
			});

			await assert.rejects(
				() => client.getEmailNotificationsByReference('create-case:PLAN-123456'),
				(err) => {
					assert.ok(err instanceof NotifyError);
					assert.strictEqual(err.status, 503);
					assert.strictEqual(err.reason, NotifyErrorReason.SERVER_ERROR);
					return true;
				}
			);
		});
	});
});
