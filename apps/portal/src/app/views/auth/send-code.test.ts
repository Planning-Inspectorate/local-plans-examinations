// @ts-nocheck

import { mockLogger } from '@planning-inspectorate/core/testing';
import assert from 'node:assert';
import { describe, it, mock } from 'node:test';
import { NotifyError, NotifyErrorReason } from '@pins/local-plans-lib/govnotify/notify-error.ts';
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
			expiryMinutes: '15',
			caseReference: 'PLAN-123456',
			signInUrl: 'https://portal.example.com/login/enter-code'
		});

		assert.strictEqual(service.notifyClient.sendAuthCode.mock.callCount(), 1);
		const [email, personalisation, reference] = service.notifyClient.sendAuthCode.mock.calls[0].arguments;
		assert.strictEqual(email, 'user@example.com');
		assert.deepStrictEqual(personalisation, {
			authCode: 'XYZABCDE',
			expiryMinutes: '15',
			caseReference: 'PLAN-123456',
			signInUrl: 'https://portal.example.com/login/enter-code'
		});
		assert.strictEqual(reference, 'portal-login:PLAN-123456');
		assert.strictEqual(service.logger.info.mock.callCount(), 1);
		const logArgs = service.logger.info.mock.calls[0].arguments;
		assert.strictEqual(logArgs[0].email, 'user@example.com');
	});

	it('should leave out the reference when there is no case reference', async () => {
		const service = createMockService();

		await sendAuthCodeNotification(service, 'user@example.com', {
			authCode: 'XYZABCDE',
			expiryMinutes: '15',
			caseReference: '',
			signInUrl: 'https://portal.example.com/login/enter-code'
		});

		assert.strictEqual(service.notifyClient.sendAuthCode.mock.calls[0].arguments[2], undefined);
	});

	it('should log and rethrow the original error when sendAuthCode fails', async () => {
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
			(err) => err === originalError
		);

		assert.strictEqual(service.logger.error.mock.callCount(), 1);
		const [details, message] = service.logger.error.mock.calls[0].arguments;
		assert.strictEqual(details.email, 'test@example.com');
		assert.strictEqual(details.error, originalError);
		assert.strictEqual(message, 'Failed to send auth code notification');
	});

	it('should rethrow a NotifyError unchanged so callers can act on its reason', async () => {
		const notifyError = new NotifyError(400, [
			{ error: 'BadRequestError', message: "Can't send to this recipient using a team-only API key" }
		]);
		const service = createMockService();
		service.notifyClient.sendAuthCode.mock.mockImplementation(async () => {
			throw notifyError;
		});

		await assert.rejects(
			() =>
				sendAuthCodeNotification(service, 'test@example.com', {
					authCode: 'ABCDEFGH',
					expiryMinutes: '20',
					caseReference: 'PLAN-123456'
				}),
			(err) => {
				assert.strictEqual(err, notifyError);
				assert.ok(err instanceof NotifyError);
				assert.strictEqual(err.reason, NotifyErrorReason.TEAM_ONLY_KEY);
				return true;
			}
		);
	});
});
