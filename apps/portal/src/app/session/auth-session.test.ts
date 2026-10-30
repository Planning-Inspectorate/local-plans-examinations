import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	clearLoginEmail,
	completeAuthentication,
	consumeNewCodeMessage,
	markNewCodeSent,
	setLoginEmail
} from './auth-session.ts';

describe('authentication session transitions', () => {
	it('sets and clears the login email without changing other state', () => {
		const session = { email: 'previous@example.com', isAuthenticated: true };

		setLoginEmail(session, 'user@example.com');
		assert.equal(session.email, 'user@example.com');
		clearLoginEmail(session);

		assert.deepEqual(session, { isAuthenticated: true });
	});

	it('completes authentication and clears only the login email', () => {
		const session = { email: 'user@example.com', showNewCodeMessage: true, visits: 2 };

		completeAuthentication(session, 'user@example.com');

		assert.deepEqual(session, {
			isAuthenticated: true,
			authenticatedEmail: 'user@example.com',
			showNewCodeMessage: true,
			visits: 2
		});
	});

	it('sets the resend state and consumes the message once', () => {
		const session = { email: 'user@example.com' };

		markNewCodeSent(session, 'user@example.com');
		assert.deepEqual(session, {
			email: 'user@example.com',
			caseReference: 'user@example.com',
			showNewCodeMessage: true
		});
		assert.equal(consumeNewCodeMessage(session), true);
		assert.equal(consumeNewCodeMessage(session), false);
		assert.deepEqual(session, { email: 'user@example.com', caseReference: 'user@example.com' });
	});
});
