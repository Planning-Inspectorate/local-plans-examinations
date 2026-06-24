// @ts-nocheck

import { mockLogger } from '@pins/local-plans-lib/testing/mock-logger.ts';
import assert from 'node:assert';
import { describe, it, mock } from 'node:test';
import { buildSubmitEmailPage, buildSubmitOtpPage } from './controller.ts';

function createMockService(overrides = {}) {
	return {
		logger: mockLogger(),
		db: {
			case: { findFirst: mock.fn() },
			oneTimePassword: {
				findUnique: mock.fn(),
				upsert: mock.fn(),
				update: mock.fn()
			}
		},
		notifyClient: {
			sendAuthCode: mock.fn(async () => {})
		},
		...overrides
	};
}

function createMockRes() {
	const res = {
		render: mock.fn(() => res),
		redirect: mock.fn(() => res)
	};
	return res;
}

function createMockReq(body = {}, session = {}) {
	return {
		body,
		session,
		baseUrl: '/login',
		protocol: 'http',
		get: (header) => (header === 'host' ? 'localhost:8080' : undefined)
	};
}

function assertRender(res, view, check) {
	assert.strictEqual(res.render.mock.callCount(), 1);
	assert.strictEqual(res.redirect.mock.callCount(), 0);
	const [renderedView, data] = res.render.mock.calls[0].arguments;
	assert.strictEqual(renderedView, view);
	if (check) check(data);
	return data;
}

function assertRedirect(res, url) {
	assert.strictEqual(res.redirect.mock.callCount(), 1);
	assert.strictEqual(res.render.mock.callCount(), 0);
	assert.strictEqual(res.redirect.mock.calls[0].arguments[0], url);
}

describe('buildSubmitEmailPage', () => {
	it('should render error when email is not provided', async () => {
		const service = createMockService();
		const handler = buildSubmitEmailPage(service);
		const req = createMockReq({ email: '' });
		const res = createMockRes();

		await handler(req, res);

		const data = assertRender(res, 'views/login/enter-email-page.njk');
		assert.strictEqual(data.errors.email.msg, 'Enter your email address');
		assert.strictEqual(data.errorSummaryTitle, 'You have not entered your email address');
		assert.deepStrictEqual(data.errorSummary, [{ text: 'Enter your email address', href: '#email' }]);
		assert.strictEqual(service.db.case.findFirst.mock.callCount(), 0);
		assert.strictEqual(service.notifyClient.sendAuthCode.mock.callCount(), 0);
	});

	it('should render error when email is only whitespace', async () => {
		const service = createMockService();
		const handler = buildSubmitEmailPage(service);
		const req = createMockReq({ email: '   ' });
		const res = createMockRes();

		await handler(req, res);

		const data = assertRender(res, 'views/login/enter-email-page.njk');
		assert.strictEqual(data.errors.email.msg, 'Enter your email address');
		assert.strictEqual(data.errorSummaryTitle, 'You have not entered your email address');
		assert.strictEqual(service.db.case.findFirst.mock.callCount(), 0);
	});

	it('should render error when email is not associated with a case', async () => {
		const service = createMockService();
		service.db.case.findFirst.mock.mockImplementation(async () => null);

		const handler = buildSubmitEmailPage(service);
		const req = createMockReq({ email: 'unknown@example.com' });
		const res = createMockRes();

		await handler(req, res);

		const data = assertRender(res, 'views/login/enter-email-page.njk');
		assert.strictEqual(data.errors.email.msg, 'Enter an email address linked to a case on this service');
		assert.strictEqual(data.errorSummaryTitle, 'We did not recognise that email address');
		assert.strictEqual(service.notifyClient.sendAuthCode.mock.callCount(), 0);
		assert.strictEqual(service.db.oneTimePassword.upsert.mock.callCount(), 0);
	});

	it('should render lockout error when user is locked out', async () => {
		const originalEnv = process.env.NODE_ENV;
		process.env.NODE_ENV = 'production';
		const service = createMockService();
		service.db.case.findFirst.mock.mockImplementation(async () => ({ id: 1 }));
		service.db.oneTimePassword.findUnique.mock.mockImplementation(async () => ({
			email: 'test@example.com',
			locked_out_until: new Date(Date.now() + 60 * 60 * 1000),
			attempts: 3
		}));

		const handler = buildSubmitEmailPage(service);
		const req = createMockReq({ email: 'test@example.com' });
		const res = createMockRes();

		await handler(req, res);

		const data = assertRender(res, 'views/login/enter-email-page.njk');
		assert.match(data.errors.email.msg, /locked out/i);
		assert.strictEqual(data.errorSummaryTitle, 'Your account is temporarily locked');
		assert.strictEqual(service.notifyClient.sendAuthCode.mock.callCount(), 0);
		assert.strictEqual(service.db.oneTimePassword.upsert.mock.callCount(), 0);
		process.env.NODE_ENV = originalEnv;
	});

	it('should reset lockout when lock time has expired', async () => {
		const service = createMockService();
		service.db.case.findFirst.mock.mockImplementation(async () => ({ id: 1 }));
		service.db.oneTimePassword.findUnique.mock.mockImplementation(async () => ({
			email: 'test@example.com',
			locked_out_until: new Date(Date.now() - 1000),
			attempts: 1
		}));
		service.db.oneTimePassword.update.mock.mockImplementation(async () => ({}));
		service.db.oneTimePassword.upsert.mock.mockImplementation(async () => ({}));

		const handler = buildSubmitEmailPage(service);
		const req = createMockReq({ email: 'test@example.com' });
		const res = createMockRes();

		await handler(req, res);

		assert.strictEqual(service.db.oneTimePassword.update.mock.callCount(), 1);
		const updateArgs = service.db.oneTimePassword.update.mock.calls[0].arguments[0];
		assert.strictEqual(updateArgs.data.attempts, 0);
		assert.strictEqual(updateArgs.data.locked_out_until, null);
	});

	it('should create OTP, set session email, send notification, and redirect on success', async () => {
		const service = createMockService();
		service.db.case.findFirst.mock.mockImplementation(async () => ({ id: 1 }));
		service.db.oneTimePassword.findUnique.mock.mockImplementation(async () => null);
		service.db.oneTimePassword.upsert.mock.mockImplementation(async () => ({}));

		const handler = buildSubmitEmailPage(service);
		const req = createMockReq({ email: '  Test@Example.COM  ' });
		const res = createMockRes();

		await handler(req, res);

		// email should be sanitised (trimmed + lowercased)
		assert.strictEqual(req.session.email, 'test@example.com');
		assert.strictEqual(service.db.case.findFirst.mock.callCount(), 1);
		assert.strictEqual(service.db.oneTimePassword.upsert.mock.callCount(), 1);
		assert.strictEqual(service.notifyClient.sendAuthCode.mock.callCount(), 1);
		assertRedirect(res, '/login/enter-code');
	});

	it('should render generic error when database throws', async () => {
		const service = createMockService();
		service.db.case.findFirst.mock.mockImplementation(async () => {
			throw new Error('DB connection failed');
		});

		const handler = buildSubmitEmailPage(service);
		const req = createMockReq({ email: 'test@example.com' });
		const res = createMockRes();

		await handler(req, res);

		const data = assertRender(res, 'views/login/enter-email-page.njk');
		assert.match(data.errors.email.msg, /something went wrong/i);
		assert.strictEqual(data.errorSummaryTitle, 'We could not sign you in');
		assert.strictEqual(service.logger.error.mock.callCount(), 1);
		assert.strictEqual(service.notifyClient.sendAuthCode.mock.callCount(), 0);
	});

	it('should still redirect when notify fails (fire-and-forget)', async () => {
		const service = createMockService();
		service.db.case.findFirst.mock.mockImplementation(async () => ({ id: 1 }));
		service.db.oneTimePassword.findUnique.mock.mockImplementation(async () => null);
		service.db.oneTimePassword.upsert.mock.mockImplementation(async () => ({}));
		service.notifyClient.sendAuthCode.mock.mockImplementation(async () => {
			throw new Error('Notify API error');
		});

		const handler = buildSubmitEmailPage(service);
		const req = createMockReq({ email: 'test@example.com' });
		const res = createMockRes();

		await handler(req, res);

		assertRedirect(res, '/login/enter-code');
	});
});

describe('buildSubmitOtpPage', () => {
	it('should redirect to login when no email in session', async () => {
		const service = createMockService();
		const handler = buildSubmitOtpPage(service);
		const req = createMockReq({}, {});
		const res = createMockRes();

		await handler(req, res);

		assertRedirect(res, '/login');
		assert.strictEqual(service.db.oneTimePassword.findUnique.mock.callCount(), 0);
	});

	it('should render error when OTP is not provided', async () => {
		const service = createMockService();
		const handler = buildSubmitOtpPage(service);
		const req = createMockReq({ otp: '' }, { email: 'test@example.com' });
		const res = createMockRes();

		await handler(req, res);

		const data = assertRender(res, 'views/login/enter-otp.njk');
		assert.match(data.errors.otp.msg, /enter the code/i);
		assert.strictEqual(data.errorSummaryTitle, 'You have not entered a code');
		assert.strictEqual(service.db.oneTimePassword.findUnique.mock.callCount(), 0);
	});

	it('should render error when no OTP record found in DB', async () => {
		const service = createMockService();
		service.db.oneTimePassword.findUnique.mock.mockImplementation(async () => null);

		const handler = buildSubmitOtpPage(service);
		const req = createMockReq({ otp: 'ABCDEFGH' }, { email: 'test@example.com' });
		const res = createMockRes();

		await handler(req, res);

		const data = assertRender(res, 'views/login/enter-otp.njk');
		assert.match(data.errors.otp.msg, /Enter the code we sent to your email address/i);
		assert.strictEqual(data.errorSummaryTitle, 'We could not verify your code');
		assert.strictEqual(service.db.oneTimePassword.update.mock.callCount(), 0);
	});

	it('should render lockout error when user is locked out', async () => {
		const service = createMockService();
		service.db.oneTimePassword.findUnique.mock.mockImplementation(async () => ({
			email: 'test@example.com',
			hashedOtp: 'hashed',
			expiresAt: new Date(Date.now() + 60000),
			attempts: 3,
			locked_out_until: new Date(Date.now() + 60 * 60 * 1000)
		}));

		const originalEnv = process.env.NODE_ENV;
		process.env.NODE_ENV = 'production';
		const handler = buildSubmitOtpPage(service);
		const req = createMockReq({ otp: 'ABCDEFGH' }, { email: 'test@example.com' });
		const res = createMockRes();

		await handler(req, res);

		const data = assertRender(res, 'views/login/enter-otp.njk');
		assert.match(data.errors.otp.msg, /locked out/i);
		assert.strictEqual(data.errorSummaryTitle, 'Your account is temporarily locked');
		assert.strictEqual(service.db.oneTimePassword.update.mock.callCount(), 0);
		process.env.NODE_ENV = originalEnv;
	});

	it('should render expiry error when OTP has expired', async () => {
		const service = createMockService();
		service.db.oneTimePassword.findUnique.mock.mockImplementation(async () => ({
			email: 'test@example.com',
			hashedOtp: 'hashed',
			expiresAt: new Date(Date.now() - 1000),
			attempts: 0,
			locked_out_until: null
		}));

		const handler = buildSubmitOtpPage(service);
		const req = createMockReq({ otp: 'ABCDEFGH' }, { email: 'test@example.com' });
		const res = createMockRes();

		await handler(req, res);

		const data = assertRender(res, 'views/login/enter-otp.njk');
		assert.match(data.errors.otp.msg, /expired/i);
		assert.strictEqual(data.errorSummaryTitle, 'Your code has expired');
		assert.strictEqual(service.db.oneTimePassword.update.mock.callCount(), 0);
	});

	it('should render incorrect code error and increment attempts on wrong OTP', async () => {
		const bcrypt = await import('bcrypt');
		const hashedOtp = await bcrypt.hash('ABCDEFGH', 10);

		const service = createMockService();
		service.db.oneTimePassword.findUnique.mock.mockImplementation(async () => ({
			email: 'test@example.com',
			hashedOtp,
			expiresAt: new Date(Date.now() + 60000),
			attempts: 0,
			locked_out_until: null
		}));
		service.db.oneTimePassword.update.mock.mockImplementation(async () => ({ attempts: 1 }));

		const handler = buildSubmitOtpPage(service);
		const req = createMockReq({ otp: 'WRONGCODE' }, { email: 'test@example.com' });
		const res = createMockRes();

		await handler(req, res);

		assert.strictEqual(service.db.oneTimePassword.update.mock.callCount(), 1);
		assert.strictEqual(res.render.mock.callCount(), 1);
		const [, data] = res.render.mock.calls[0].arguments;
		assert.match(data.errors.otp.msg, /Enter the code we sent to your email address/i);
		assert.strictEqual(data.errorSummaryTitle, 'The code you entered is incorrect');
	});

	it('should lock out user after max failed attempts', async () => {
		const bcrypt = await import('bcrypt');
		const hashedOtp = await bcrypt.hash('ABCDEFGH', 10);

		const service = createMockService();
		service.db.oneTimePassword.findUnique.mock.mockImplementation(async () => ({
			email: 'test@example.com',
			hashedOtp,
			expiresAt: new Date(Date.now() + 60000),
			attempts: 2,
			locked_out_until: null
		}));
		let updateCallCount = 0;
		service.db.oneTimePassword.update.mock.mockImplementation(async () => {
			updateCallCount++;
			if (updateCallCount === 1) return { attempts: 3 };
			return {};
		});

		const originalEnv = process.env.NODE_ENV;
		process.env.NODE_ENV = 'production';
		const handler = buildSubmitOtpPage(service);
		const req = createMockReq({ otp: 'WRONGCODE' }, { email: 'test@example.com' });
		const res = createMockRes();

		await handler(req, res);

		assert.strictEqual(service.db.oneTimePassword.update.mock.callCount(), 2);
		const [, data] = res.render.mock.calls[0].arguments;
		assert.match(data.errors.otp.msg, /locked out/i);
		assert.strictEqual(data.errorSummaryTitle, 'Your account is temporarily locked');
		process.env.NODE_ENV = originalEnv;
	});

	it('should redirect to home on successful OTP verification', async () => {
		const bcrypt = await import('bcrypt');
		const hashedOtp = await bcrypt.hash('ABCDEFGH', 10);

		const service = createMockService();
		service.db.oneTimePassword.findUnique.mock.mockImplementation(async () => ({
			email: 'test@example.com',
			hashedOtp,
			expiresAt: new Date(Date.now() + 60000),
			attempts: 0,
			locked_out_until: null
		}));
		service.db.oneTimePassword.update.mock.mockImplementation(async () => ({}));

		const handler = buildSubmitOtpPage(service);
		const req = createMockReq({ otp: 'ABCDEFGH' }, { email: 'test@example.com' });
		const res = createMockRes();

		await handler(req, res);

		assertRedirect(res, '/landingPage');
		assert.strictEqual(service.db.oneTimePassword.update.mock.callCount(), 1);
		const updateArgs = service.db.oneTimePassword.update.mock.calls[0].arguments[0];
		assert.strictEqual(updateArgs.data.attempts, 0);
		assert.strictEqual(updateArgs.data.locked_out_until, null);
		assert.strictEqual(service.logger.info.mock.callCount(), 1);
	});

	it('should render generic error when database throws during OTP verification', async () => {
		const service = createMockService();
		service.db.oneTimePassword.findUnique.mock.mockImplementation(async () => {
			throw new Error('DB error');
		});

		const handler = buildSubmitOtpPage(service);
		const req = createMockReq({ otp: 'ABCDEFGH' }, { email: 'test@example.com' });
		const res = createMockRes();

		await handler(req, res);

		const data = assertRender(res, 'views/login/enter-otp.njk');
		assert.match(data.errors.otp.msg, /something went wrong/i);
		assert.strictEqual(data.errorSummaryTitle, 'We could not verify your code');
		assert.strictEqual(service.logger.error.mock.callCount(), 1);
		const logArgs = service.logger.error.mock.calls[0].arguments;
		assert.strictEqual(logArgs[0].email, 'test@example.com');
	});
});
