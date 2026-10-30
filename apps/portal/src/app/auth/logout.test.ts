// @ts-nocheck

import assert from 'node:assert/strict';
import { it, mock } from 'node:test';
import { logout } from './logout.ts';

it('destroys the session and redirects to login after the callback', () => {
	const req = { session: { destroy: mock.fn() } };
	const res = { redirect: mock.fn() };

	logout(req, res);

	assert.equal(req.session.destroy.mock.callCount(), 1);
	assert.equal(res.redirect.mock.callCount(), 0);

	const [callback] = req.session.destroy.mock.calls[0].arguments;
	callback();

	assert.equal(res.redirect.mock.callCount(), 1);
	assert.deepEqual(res.redirect.mock.calls[0].arguments, ['/login']);
});
