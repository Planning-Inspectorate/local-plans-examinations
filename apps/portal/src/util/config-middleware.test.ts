import { addLocalsConfiguration } from './config-middleware.ts';
import assert from 'node:assert';
import { describe, it, mock } from 'node:test';

describe('addLocalsConfiguration', () => {
	it('adds accepted cookie consent to locals', () => {
		const req = { path: '/', cookies: { cookie_consent: 'accept' } };
		const res = { locals: {} };
		const next = mock.fn();

		addLocalsConfiguration()(req as any, res as any, next);

		assert.strictEqual(res.locals.cookieConsent, 'accept');
		assert.strictEqual(next.mock.callCount(), 1);
	});

	it('adds rejected cookie consent to locals', () => {
		const req = { path: '/', cookies: { cookie_consent: 'reject' } };
		const res = { locals: {} };

		addLocalsConfiguration()(req as any, res as any, mock.fn());

		assert.strictEqual(res.locals.cookieConsent, 'reject');
	});

	it('ignores invalid cookie consent values', () => {
		const req = { path: '/', cookies: { cookie_consent: 'maybe' } };
		const res = { locals: {} };

		addLocalsConfiguration()(req as any, res as any, mock.fn());

		assert.strictEqual(res.locals.cookieConsent, undefined);
	});
});
