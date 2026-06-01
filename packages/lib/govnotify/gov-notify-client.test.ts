// @ts-nocheck

import { mockLogger } from '@pins/local-plans-lib/testing/mock-logger.ts';
import assert from 'node:assert';
import { describe, it, mock } from 'node:test';
import { GovNotifyClient } from './gov-notify-client.ts';

type MockNotifyClient = {
	sendEmail: ReturnType<typeof mock.fn>;
	getNotificationById: ReturnType<typeof mock.fn>;
};

type TestableGovNotifyClient = GovNotifyClient & {
	notifyClient: MockNotifyClient;
};

function createMockNotifyClient(): MockNotifyClient {
	return {
		sendEmail: mock.fn(),
		getNotificationById: mock.fn()
	};
}

function createTestClient(templateIds = { authCode: 'template-123' }) {
	const logger = mockLogger();
	const client = new GovNotifyClient(logger, 'test-api-key', templateIds) as TestableGovNotifyClient;
	const mockNotify = createMockNotifyClient();
	client.notifyClient = mockNotify;
	return { logger, client, mockNotify };
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
	});

	describe('sendAuthCode', () => {
		it('should call sendEmail with authCode template', async () => {
			const { client, mockNotify } = createTestClient({ authCode: 'auth-template-id' });
			mockNotify.sendEmail.mock.mockImplementation(async () => ({}));

			await client.sendAuthCode('user@example.com', { authCode: 'XYZABC', expiryMinutes: '20' });

			assert.strictEqual(mockNotify.sendEmail.mock.callCount(), 1);
			const [templateId, email, options] = mockNotify.sendEmail.mock.calls[0].arguments;
			assert.strictEqual(templateId, 'auth-template-id');
			assert.strictEqual(email, 'user@example.com');
			assert.deepStrictEqual(options.personalisation, { authCode: 'XYZABC', expiryMinutes: '20' });
		});
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
});
