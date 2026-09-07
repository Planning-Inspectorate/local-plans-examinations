// @ts-nocheck

import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';
import { checkIsAuthenticated } from './guards.ts';

describe('checkIsAuthenticated', () => {
	it('redirects unauthenticated users to login', () => {
		const req = { session: {} };
		const res = createMockResponse();
		const next = mock.fn();

		checkIsAuthenticated(req, res, next);

		assert.equal(next.mock.callCount(), 0);
		assert.equal(res.redirect.mock.callCount(), 1);
		assert.equal(res.redirect.mock.calls[0].arguments[0], '/login');
	});

	it('allows authenticated users through', () => {
		const req = { session: { isAuthenticated: true } };
		const res = createMockResponse();
		const next = mock.fn();

		checkIsAuthenticated(req, res, next);

		assert.equal(next.mock.callCount(), 1);
		assert.equal(res.redirect.mock.callCount(), 0);
	});
});

function createMockResponse() {
	return {
		redirect: mock.fn()
	};
}
