import { addLocalsConfiguration } from './config-middleware.ts';
import assert from 'node:assert';
import { describe, it, mock } from 'node:test';

describe('addLocalsConfiguration', () => {
	it('adds accepted cookie consent to locals', () => {
		const req = { path: '/', cookies: { cookie_consent: 'accept' } };
		const res = { locals: {} as { config?: { clarityId?: string }; cookieConsent?: string } };
		const next = mock.fn();

		addLocalsConfiguration('abc123')(req as any, res as any, next);

		assert.strictEqual(res.locals.cookieConsent, 'accept');
		assert.strictEqual(res.locals.config?.clarityId, 'abc123');
		assert.strictEqual(next.mock.callCount(), 1);
	});

	it('adds rejected cookie consent to locals', () => {
		const req = { path: '/', cookies: { cookie_consent: 'reject' } };
		const res = { locals: {} as { config?: { clarityId?: string }; cookieConsent?: string } };

		addLocalsConfiguration('abc123')(req as any, res as any, mock.fn());

		assert.strictEqual(res.locals.cookieConsent, 'reject');
		assert.strictEqual(res.locals.config?.clarityId, undefined);
	});

	it('ignores invalid cookie consent values', () => {
		const req = { path: '/', cookies: { cookie_consent: 'maybe' } };
		const res = { locals: {} as { config?: { clarityId?: string }; cookieConsent?: string } };

		addLocalsConfiguration('abc123')(req as any, res as any, mock.fn());

		assert.strictEqual(res.locals.cookieConsent, undefined);
		assert.strictEqual(res.locals.config?.clarityId, undefined);
	});
});
