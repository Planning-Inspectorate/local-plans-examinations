import { afterEach, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert';
import { isPerformanceTestAuthBypassRequest } from './performance-auth-bypass.ts';

const originalEnvironment = process.env.ENVIRONMENT;
const originalToken = process.env.PERFORMANCE_TEST_AUTH_TOKEN;
const token = 'performance-token';

describe('isPerformanceTestAuthBypassRequest', () => {
	beforeEach(() => {
		process.env.ENVIRONMENT = 'test';
		process.env.PERFORMANCE_TEST_AUTH_TOKEN = token;
	});

	afterEach(() => {
		restoreEnv('ENVIRONMENT', originalEnvironment);
		restoreEnv('PERFORMANCE_TEST_AUTH_TOKEN', originalToken);
	});

	it('allows the performance auth token for an allowed route', () => {
		assert.strictEqual(isPerformanceTestAuthBypassRequest(mockRequest(), ['/']), true);
	});

	it('rejects a missing or incorrect token', () => {
		assert.strictEqual(isPerformanceTestAuthBypassRequest(mockRequest({ token: null }), ['/']), false);
		assert.strictEqual(isPerformanceTestAuthBypassRequest(mockRequest({ token: 'wrong-token' }), ['/']), false);
	});

	it('rejects a route outside the performance allow-list', () => {
		assert.strictEqual(isPerformanceTestAuthBypassRequest(mockRequest({ path: '/case/PLAN-001' }), ['/']), false);
	});

	it('rejects requests outside Test', () => {
		process.env.ENVIRONMENT = 'dev';

		assert.strictEqual(isPerformanceTestAuthBypassRequest(mockRequest(), ['/']), false);
	});
});

function mockRequest({ path = '/', token: requestToken = token }: { path?: string; token?: string | null } = {}) {
	return {
		method: 'GET',
		path,
		get(name: string) {
			return name === 'X-Performance-Test-Auth' ? (requestToken ?? undefined) : undefined;
		}
	};
}

function restoreEnv(name: string, value: string | undefined) {
	if (value === undefined) {
		delete process.env[name];
		return;
	}

	process.env[name] = value;
}
