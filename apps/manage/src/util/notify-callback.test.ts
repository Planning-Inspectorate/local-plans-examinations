// @ts-nocheck

import { mockLogger } from '@pins/local-plans-lib/testing/mock-logger.ts';
import assert from 'node:assert';
import { describe, it, mock } from 'node:test';
import { buildNotifyCallbackTokenValidator } from './notify-callback.ts';

function createMockService(overrides = {}) {
	return {
		logger: mockLogger(),
		webHookToken: 'valid-token',
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

function createReq(token) {
	return {
		headers: token ? { authorization: `Bearer ${token}` } : {}
	};
}

function assertStatus(res, statusCode) {
	assert.strictEqual(res.status.mock.callCount(), 1);
	assert.strictEqual(res.status.mock.calls[0].arguments[0], statusCode);
}

function assertResponseBody(res, body) {
	assert.strictEqual(res.send.mock.callCount(), 1);
	assert.strictEqual(res.send.mock.calls[0].arguments[0], body);
}

describe('buildNotifyCallbackTokenValidator', () => {
	it('should return 500 when webHookToken is not configured', async () => {
		const service = createMockService({ webHookToken: undefined });
		const validator = buildNotifyCallbackTokenValidator(service);
		const req = createReq('some-token');
		const res = createMockRes();
		const next = mock.fn();

		await validator(req, res, next);

		assertStatus(res, 500);
		assertResponseBody(res, 'Server configuration error');
		assert.strictEqual(next.mock.callCount(), 0);
		assert.strictEqual(service.logger.warn.mock.callCount(), 1);
	});

	it('should return 401 when authorization header is missing', async () => {
		const service = createMockService();
		const validator = buildNotifyCallbackTokenValidator(service);
		const req = createReq();
		const res = createMockRes();
		const next = mock.fn();

		await validator(req, res, next);

		assertStatus(res, 401);
		assertResponseBody(res, 'Unauthorized access');
		assert.strictEqual(next.mock.callCount(), 0);
		assert.strictEqual(service.logger.warn.mock.callCount(), 1);
	});

	it('should return 401 when token does not match', async () => {
		const service = createMockService();
		const validator = buildNotifyCallbackTokenValidator(service);
		const req = createReq('wrong-token');
		const res = createMockRes();
		const next = mock.fn();

		await validator(req, res, next);

		assertStatus(res, 401);
		assertResponseBody(res, 'Unauthorized access');
		assert.strictEqual(next.mock.callCount(), 0);
		assert.strictEqual(service.logger.warn.mock.callCount(), 1);
	});

	it('should return 401 when authorization header has no Bearer prefix', async () => {
		const service = createMockService();
		const validator = buildNotifyCallbackTokenValidator(service);
		const req = { headers: { authorization: 'valid-token' } };
		const res = createMockRes();
		const next = mock.fn();

		await validator(req, res, next);

		assertStatus(res, 401);
		assertResponseBody(res, 'Unauthorized access');
		assert.strictEqual(next.mock.callCount(), 0);
	});

	it('should return 401 when Bearer prefix is present but token is empty', async () => {
		const service = createMockService();
		const validator = buildNotifyCallbackTokenValidator(service);
		const req = { headers: { authorization: 'Bearer ' } };
		const res = createMockRes();
		const next = mock.fn();

		await validator(req, res, next);

		assertStatus(res, 401);
		assertResponseBody(res, 'Unauthorized access');
		assert.strictEqual(next.mock.callCount(), 0);
	});

	it('should call next() with no arguments when token is valid', async () => {
		const service = createMockService();
		const validator = buildNotifyCallbackTokenValidator(service);
		const req = createReq('valid-token');
		const res = createMockRes();
		const next = mock.fn();

		await validator(req, res, next);

		assert.strictEqual(next.mock.callCount(), 1);
		assert.deepStrictEqual(next.mock.calls[0].arguments, []);
		assert.strictEqual(res.status.mock.callCount(), 0);
		assert.strictEqual(res.send.mock.callCount(), 0);
	});
});
