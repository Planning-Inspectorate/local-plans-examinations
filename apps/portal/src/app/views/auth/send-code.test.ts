// @ts-nocheck

import { mockLogger } from '@pins/local-plans-lib/testing/mock-logger.ts';
import assert from 'node:assert';
import { describe, it, mock } from 'node:test';
import { sendAuthCodeNotification } from './send-code.ts';

function createMockService(overrides = {}) {
	return {
		logger: mockLogger(),
		notifyClient: {
			sendAuthCode: mock.fn(async () => {})
		},
		...overrides
	};
}

describe('sendAuthCodeNotification', () => {
	it('should skip sending when notifyClient is null', async () => {
		const service = createMockService({ notifyClient: null });

		await assert.doesNotReject(() =>
			sendAuthCodeNotification(service, 'test@example.com', {
				authCode: 'ABCDEFGH',
				expiryMinutes: '20'
			})
		);

		assert.strictEqual(service.logger.warn.mock.callCount(), 1);
	});

	it('should call sendAuthCode with correct parameters', async () => {
		const service = createMockService();

		await sendAuthCodeNotification(service, 'user@example.com', {
			authCode: 'XYZABCDE',
			expiryMinutes: '15'
		});

		assert.strictEqual(service.notifyClient.sendAuthCode.mock.callCount(), 1);
		const [email, personalisation] = service.notifyClient.sendAuthCode.mock.calls[0].arguments;
		assert.strictEqual(email, 'user@example.com');
		assert.deepStrictEqual(personalisation, { authCode: 'XYZABCDE', expiryMinutes: '15' });
		assert.strictEqual(service.logger.info.mock.callCount(), 1);
		const logArgs = service.logger.info.mock.calls[0].arguments;
		assert.strictEqual(logArgs[0].email, 'user@example.com');
	});

	it('should throw with user-friendly message when sendAuthCode fails', async () => {
		const originalError = new Error('Notify API down');
		const service = createMockService();
		service.notifyClient.sendAuthCode.mock.mockImplementation(async () => {
			throw originalError;
		});

		await assert.rejects(
			() =>
				sendAuthCodeNotification(service, 'test@example.com', {
					authCode: 'ABCDEFGH',
					expiryMinutes: '20'
				}),
			(err) => {
				assert.match(err.message, /failed to send authentication code/i);
				assert.strictEqual(err.cause, originalError);
				return true;
			}
		);

		assert.strictEqual(service.logger.error.mock.callCount(), 1);
		const logArgs = service.logger.error.mock.calls[0].arguments;
		assert.strictEqual(logArgs[0].email, 'test@example.com');
	});
});
