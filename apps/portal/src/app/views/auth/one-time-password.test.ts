import assert from 'node:assert';
import bcrypt from 'bcrypt';
import { describe, it } from 'node:test';
import { createOneTimePassword } from './one-time-password.ts';

describe('createOneTimePassword', () => {
	it('generates an eight-letter code with a matching hash and 20-minute expiry', async () => {
		const createdAt = Date.now();
		const { otp, hashedOtp, expiresAt } = await createOneTimePassword();

		assert.match(otp, /^[A-Z]{8}$/);
		assert.strictEqual(await bcrypt.compare(otp, hashedOtp), true);
		assert.ok(expiresAt.getTime() >= createdAt + 20 * 60 * 1000);
		assert.ok(expiresAt.getTime() <= Date.now() + 20 * 60 * 1000);
	});
});
