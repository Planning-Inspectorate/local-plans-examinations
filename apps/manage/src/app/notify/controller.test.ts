// @ts-nocheck

import { mockLogger } from '@pins/local-plans-lib/testing/mock-logger.ts';
import assert from 'node:assert';
import { describe, it, mock } from 'node:test';
import { buildNotifyCallbackController } from './controller.ts';

function createMockService(overrides = {}) {
	return {
		logger: mockLogger(),
		notifyClient: {
			getNotificationById: mock.fn()
		},
		db: {
			notifyEmail: {
				create: mock.fn()
			}
		},
		...overrides
	};
}

function createMockRes() {
	const res = {
		status: mock.fn(() => res),
		send: mock.fn(() => res)
	};
	return res;
}

function assertStatus(res, statusCode) {
	assert.strictEqual(res.status.mock.callCount(), 1);
	assert.strictEqual(res.status.mock.calls[0].arguments[0], statusCode);
}

function assertResponseBody(res, body) {
	assert.strictEqual(res.send.mock.callCount(), 1);
	assert.strictEqual(res.send.mock.calls[0].arguments[0], body);
}

function createNotification(overrides = {}) {
	return {
		id: 'notification-123',
		reference: 'ref-456',
		created_at: '2026-01-01T00:00:00Z',
		completed_at: '2026-01-01T00:01:00Z',
		status: 'delivered',
		template: { id: 'template-789', version: 1 },
		body: 'Your code is ABCDEFGH',
		subject: 'Authentication code',
		email_address: 'test@example.com',
		...overrides
	};
}

describe('buildNotifyCallbackController', () => {
	it('should return 400 when notification ID is missing', async () => {
		const service = createMockService();
		const handler = buildNotifyCallbackController(service);
		const req = { body: {} };
		const res = createMockRes();

		await handler(req, res);

		assertStatus(res, 400);
		assertResponseBody(res, 'Bad Request: Missing notification ID');
		assert.strictEqual(service.notifyClient.getNotificationById.mock.callCount(), 0);
		assert.strictEqual(service.db.notifyEmail.create.mock.callCount(), 0);
	});

	it('should return 500 when notifyClient is not configured', async () => {
		const service = createMockService({ notifyClient: null });
		const handler = buildNotifyCallbackController(service);
		const req = { body: { id: 'notification-123' } };
		const res = createMockRes();

		await handler(req, res);

		assertStatus(res, 500);
		assertResponseBody(res, 'Gov Notify not configured');
		assert.strictEqual(service.db.notifyEmail.create.mock.callCount(), 0);
	});

	it('should return 500 when getNotificationById throws', async () => {
		const service = createMockService();
		service.notifyClient.getNotificationById.mock.mockImplementation(async () => {
			throw new Error('Notify API failure');
		});

		const handler = buildNotifyCallbackController(service);
		const req = { body: { id: 'notification-123' } };
		const res = createMockRes();

		await handler(req, res);

		assertStatus(res, 500);
		assertResponseBody(res, 'Gov Notify API call failed');
		assert.strictEqual(service.notifyClient.getNotificationById.mock.calls[0].arguments[0], 'notification-123');
		assert.strictEqual(service.logger.error.mock.callCount(), 1);
		const logArgs = service.logger.error.mock.calls[0].arguments;
		assert.strictEqual(logArgs[0].notificationId, 'notification-123');
		assert.strictEqual(service.db.notifyEmail.create.mock.callCount(), 0);
	});

	it('should return 404 when notification data is empty', async () => {
		const service = createMockService();
		service.notifyClient.getNotificationById.mock.mockImplementation(async () => ({ data: null }));

		const handler = buildNotifyCallbackController(service);
		const req = { body: { id: 'notification-123' } };
		const res = createMockRes();

		await handler(req, res);

		assertStatus(res, 404);
		assertResponseBody(res, 'Notification not found');
		assert.strictEqual(service.db.notifyEmail.create.mock.callCount(), 0);
	});

	it('should save notification to database and return 200 on success', async () => {
		const service = createMockService();
		const notificationData = createNotification();
		service.notifyClient.getNotificationById.mock.mockImplementation(async () => ({
			data: notificationData
		}));
		service.db.notifyEmail.create.mock.mockImplementation(async () => ({}));

		const handler = buildNotifyCallbackController(service);
		const req = { body: { id: 'notification-123' } };
		const res = createMockRes();

		await handler(req, res);

		assertStatus(res, 200);
		assertResponseBody(res, 'OK');
		assert.strictEqual(service.notifyClient.getNotificationById.mock.calls[0].arguments[0], 'notification-123');
		assert.strictEqual(service.db.notifyEmail.create.mock.callCount(), 1);

		const createData = service.db.notifyEmail.create.mock.calls[0].arguments[0].data;
		assert.deepStrictEqual(createData, {
			notifyId: 'notification-123',
			reference: 'ref-456',
			createdDate: new Date('2026-01-01T00:00:00Z'),
			completedDate: new Date('2026-01-01T00:01:00Z'),
			status: 'delivered',
			templateId: 'template-789',
			templateVersion: 1,
			body: 'Your code is ABCDEFGH',
			subject: 'Authentication code',
			email: 'test@example.com'
		});
	});

	it('should return 500 when database save fails', async () => {
		const service = createMockService();
		const notificationData = createNotification();
		service.notifyClient.getNotificationById.mock.mockImplementation(async () => ({
			data: notificationData
		}));
		service.db.notifyEmail.create.mock.mockImplementation(async () => {
			throw new Error('DB write failed');
		});

		const handler = buildNotifyCallbackController(service);
		const req = { body: { id: 'notification-123' } };
		const res = createMockRes();

		await handler(req, res);

		assertStatus(res, 500);
		assertResponseBody(res, 'Database operation failed');
		assert.strictEqual(service.logger.error.mock.callCount(), 1);
		const logArgs = service.logger.error.mock.calls[0].arguments;
		assert.strictEqual(logArgs[0].notificationId, 'notification-123');
	});
});
