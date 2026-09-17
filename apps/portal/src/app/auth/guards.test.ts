// @ts-nocheck

import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';
import { checkIsAuthenticated, checkCaseOwnership } from './guards.ts';
import { exposeAuthToViews } from './guards.ts';

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
		redirect: mock.fn(),
		status: mock.fn(function () {
			return this;
		}),
		render: mock.fn()
	};
}

describe('checkCaseOwnership', () => {
	function createMockService(findFirstResult) {
		return {
			db: {
				case: {
					findFirst: mock.fn(async () => findFirstResult)
				}
			}
		};
	}

	it('calls next when no planReference param', async () => {
		const service = createMockService(null);
		const handler = checkCaseOwnership(service);
		const req = { params: {}, session: { authenticatedEmail: 'user@example.com' } };
		const res = createMockResponse();
		const next = mock.fn();

		await handler(req, res, next);

		assert.equal(next.mock.callCount(), 1);
	});

	it('redirects to login when no authenticated email', async () => {
		const service = createMockService(null);
		const handler = checkCaseOwnership(service);
		const req = { params: { planReference: 'PLAN-001' }, session: {} };
		const res = createMockResponse();
		const next = mock.fn();

		await handler(req, res, next);

		assert.equal(next.mock.callCount(), 0);
		assert.equal(res.redirect.mock.callCount(), 1);
		assert.equal(res.redirect.mock.calls[0].arguments[0], '/login');
	});

	it('returns 404 when case does not belong to the user', async () => {
		const service = createMockService(null);
		const handler = checkCaseOwnership(service);
		const req = { params: { planReference: 'PLAN-001' }, session: { authenticatedEmail: 'other@example.com' } };
		const res = createMockResponse();
		const next = mock.fn();

		await handler(req, res, next);

		assert.equal(next.mock.callCount(), 0);
		assert.equal(res.status.mock.callCount(), 1);
		assert.equal(res.status.mock.calls[0].arguments[0], 404);
		assert.equal(res.render.mock.callCount(), 1);
	});

	it('calls next when case belongs to the user', async () => {
		const service = createMockService({ id: 'case-1', reference: 'PLAN-001' });
		const handler = checkCaseOwnership(service);
		const req = { params: { planReference: 'PLAN-001' }, session: { authenticatedEmail: 'user@example.com' } };
		const res = createMockResponse();
		const next = mock.fn();

		await handler(req, res, next);

		assert.equal(next.mock.callCount(), 1);
		assert.equal(service.db.case.findFirst.mock.callCount(), 1);
	});
});

describe('exposeAuthToViews', () => {
	function createMockResponse() {
		return { locals: {} };
	}

	it('sets isAuthenticated to true when the session is authenticated', () => {
		const req = { session: { isAuthenticated: true } };
		const res = createMockResponse();
		const next = mock.fn();

		exposeAuthToViews(req, res, next);

		assert.equal(res.locals.isAuthenticated, true);
		assert.equal(next.mock.callCount(), 1);
	});

	it('sets isAuthenticated to false when the session is not authenticated', () => {
		const req = { session: {} };
		const res = createMockResponse();
		const next = mock.fn();

		exposeAuthToViews(req, res, next);

		assert.equal(res.locals.isAuthenticated, false);
		assert.equal(next.mock.callCount(), 1);
	});

	it('sets isAuthenticated to false when there is no session at all', () => {
		const req = {};
		const res = createMockResponse();
		const next = mock.fn();

		exposeAuthToViews(req, res, next);

		assert.equal(res.locals.isAuthenticated, false);
		assert.equal(next.mock.callCount(), 1);
	});
});
