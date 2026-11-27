import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getAuthRateLimitMax } from './config.ts';

describe('Manage rate limit', () => {
	it('keeps the existing defaults without a Test override', () => {
		assert.equal(getAuthRateLimitMax({ NODE_ENV: 'production', ENVIRONMENT: 'test' }), 600);
		assert.equal(getAuthRateLimitMax({ NODE_ENV: 'development', ENVIRONMENT: 'dev' }), 1000);
	});

	it('allows a higher limit in Test, including when NODE_ENV is production', () => {
		assert.equal(
			getAuthRateLimitMax({ NODE_ENV: 'production', ENVIRONMENT: 'test', AUTH_RATE_LIMIT_MAX: '10000' }),
			10000
		);
	});

	it('ignores the override outside Test', () => {
		for (const environment of ['prod', 'training', 'dev', undefined]) {
			assert.equal(
				getAuthRateLimitMax({ NODE_ENV: 'production', ENVIRONMENT: environment, AUTH_RATE_LIMIT_MAX: '10000' }),
				600
			);
		}
		assert.equal(
			getAuthRateLimitMax({ NODE_ENV: 'development', ENVIRONMENT: 'dev', AUTH_RATE_LIMIT_MAX: '10000' }),
			1000
		);
	});

	it('rejects invalid Test limits rather than disabling protection', () => {
		for (const value of ['0', '-1', '1.5', 'invalid', 'Infinity', '9007199254740992']) {
			assert.throws(
				() => getAuthRateLimitMax({ ENVIRONMENT: 'test', AUTH_RATE_LIMIT_MAX: value }),
				/AUTH_RATE_LIMIT_MAX must be a positive integer/
			);
		}
	});

	it('uses the default when the Test override is empty', () => {
		assert.equal(getAuthRateLimitMax({ NODE_ENV: 'production', ENVIRONMENT: 'test', AUTH_RATE_LIMIT_MAX: '' }), 600);
	});
});
