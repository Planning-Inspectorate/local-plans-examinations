import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ManageService } from '#service';
import type { Config } from './config.ts';
import { mock } from 'node:test';

function createManageService(overrides = {}) {
	const config = {
		auth: {
			disabled: false,
			rateLimit: 42
		},
		entra: {
			groupIds: [1, 2, 3]
		},
		govNotify: {
			webHookToken: 'someToken'
		},
		notifyCallbackEnabled: true,
		logLevel: 'silent',
		database: {
			connectionString: 'someConnectionString'
		},
		session: {
			redisPrefix: 'somePrefix:',
			redis: 'rediss://someUrl.redis.azure.net:9999',
			secret: 'someSecret'
		},
		...overrides
	};
	return new ManageService(config as unknown as Config);
}

describe('ManageService', () => {
	it('authConfig returns the correct value', () => {
		const service = createManageService({ auth: 'authValue' });
		assert.strictEqual(service.authConfig, 'authValue');
	});
	it('authDisabled returns the correct value', () => {
		const service = createManageService();
		assert.strictEqual(service.authDisabled, false);
	});
	it('authRateLimitConfig returns the correct value', () => {
		const service = createManageService();
		assert.strictEqual(service.authRateLimitConfig, 42);
	});
	it('entraGroupIds returns the correct value', () => {
		const service = createManageService();
		assert.deepStrictEqual(service.entraGroupIds, [1, 2, 3]);
	});
	it('webHookToken returns the correct value', () => {
		const service = createManageService();
		assert.strictEqual(service.webHookToken, 'someToken');
	});
	it('notifyCallbackEnabled returns the correct value', () => {
		const service = createManageService();
		assert.strictEqual(service.notifyCallbackEnabled, true);
	});
});
