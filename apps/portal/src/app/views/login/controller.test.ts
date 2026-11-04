// @ts-nocheck

import { mockLogger } from '@planning-inspectorate/core/testing';
import assert from 'node:assert';
import { describe, it, mock } from 'node:test';
import {
	buildEnterEmailPage,
	buildEnterOtpPage,
	buildNoAccessPage,
	buildRequestNewCode,
	buildSubmitEmailPage,
	buildSubmitOtpPage
} from './controller.ts';

function createMockService(overrides = {}) {
	return {
		environment: 'local',
		nodeEnv: 'development',
		auth: {
			otpBypassCode: ''
		},
		logger: mockLogger(),
		db: {
			case: { findFirst: mock.fn(async () => ({ id: 1, reference: 'PLAN-123456' })) },
			oneTimePassword: {
				delete: mock.fn(),
				findUnique: mock.fn(),
				create: mock.fn(),
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
		redirect: mock.fn(() => res),
		status: mock.fn(() => res)
	};
	return res;
}

function createMockReq(body = {}, session = {}, host = 'localhost:8080') {
	return {
		body,
		session,
		baseUrl: '/login',
		protocol: 'http',
		get: (header) => (header === 'host' ? host : undefined)
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

describe('buildEnterEmailPage', () => {
	it('should clear session email when rendered', async () => {
		const handler = buildEnterEmailPage();
		const req = createMockReq({}, { email: 'test@example.com' });
		const res = createMockRes();

		await handler(req, res);

		assert.strictEqual(req.session.email, undefined);
		assertRender(res, 'views/login/enter-email-page.njk');
	});
});

describe('buildSubmitEmailPage', () => {
	it('should render error when email is not provided', async () => {
		const service = createMockService();
		const handler = buildSubmitEmailPage(service);
		const req = createMockReq({ email: '' });
		const res = createMockRes();

		await handler(req, res);

		const data = assertRender(res, 'views/login/enter-email-page.njk');
		assert.strictEqual(data.pageHeading, 'Sign-in');
		assert.strictEqual(data.errors.email.msg, 'Enter an email address in the correct format, like name@example.com');
		assert.strictEqual(data.errorSummaryTitle, 'There is a problem');
		assert.deepStrictEqual(data.errorSummary, [
			{ text: 'Enter an email address in the correct format, like name@example.com', href: '#email' }
		]);
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
		assert.strictEqual(data.pageHeading, 'Sign-in');
		assert.strictEqual(data.errors.email.msg, 'Enter an email address in the correct format, like name@example.com');
		assert.strictEqual(data.errorSummaryTitle, 'There is a problem');
		assert.strictEqual(service.db.case.findFirst.mock.callCount(), 0);
	});

	it('should render an error without creating an OTP or sending email when email is not associated with a case', async () => {
		const service = createMockService();
		service.db.case.findFirst.mock.mockImplementation(async () => null);

		const handler = buildSubmitEmailPage(service);
		const req = createMockReq({ email: 'unknown@example.com' }, { email: 'previous@example.com' });
		const res = createMockRes();

		await handler(req, res);

		const data = assertRender(res, 'views/login/enter-email-page.njk');
		assert.strictEqual(data.pageHeading, 'Sign-in');
		assert.strictEqual(data.errors.email.msg, 'Enter an email address linked to a case on this service');
		assert.strictEqual(data.errorSummaryTitle, 'There is a problem');
		assert.deepStrictEqual(data.errorSummary, [{ text: 'We did not recognise that email address', href: '#email' }]);
		assert.strictEqual(req.session.email, undefined);
		assert.strictEqual(service.db.oneTimePassword.findUnique.mock.callCount(), 0);
		assert.strictEqual(service.notifyClient.sendAuthCode.mock.callCount(), 0);
		assert.strictEqual(service.db.oneTimePassword.upsert.mock.callCount(), 0);
	});

	it('should redirect to the OTP page when user is locked out', async () => {
		const service = createMockService({ nodeEnv: 'production' });
		service.db.case.findFirst.mock.mockImplementation(async () => ({ id: 1, reference: 'PLAN-123456' }));
		service.db.oneTimePassword.findUnique.mock.mockImplementation(async () => ({
			email: 'test@example.com',
			lockedOutUntil: new Date(Date.now() + 60 * 60 * 1000),
			attempts: 3
		}));

		const handler = buildSubmitEmailPage(service);
		const req = createMockReq({ email: 'test@example.com' });
		const res = createMockRes();

		await handler(req, res);

		assertRedirect(res, '/login/enter-code');
		assert.strictEqual(req.session.email, 'test@example.com');
		assert.strictEqual(service.notifyClient.sendAuthCode.mock.callCount(), 0);
		assert.strictEqual(service.db.oneTimePassword.upsert.mock.callCount(), 0);
	});

	it('should reset lockout when lock time has expired', async () => {
		const service = createMockService();
		service.db.case.findFirst.mock.mockImplementation(async () => ({ id: 1, reference: 'PLAN-123456' }));
		service.db.oneTimePassword.findUnique.mock.mockImplementation(async () => ({
			email: 'test@example.com',
			lockedOutUntil: new Date(Date.now() - 1000),
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
		assert.strictEqual(updateArgs.data.lockedOutUntil, null);
	});

	it('should create OTP, set session email, send notification, and redirect on success', async () => {
		const service = createMockService();
		service.db.case.findFirst.mock.mockImplementation(async () => ({ id: 1, reference: 'PLAN-123456' }));
		service.db.oneTimePassword.findUnique.mock.mockImplementation(async () => null);
		service.db.oneTimePassword.upsert.mock.mockImplementation(async () => ({}));

		const handler = buildSubmitEmailPage(service);
		const req = createMockReq({ email: '  Test@Example.COM  ' });
		const res = createMockRes();

		await handler(req, res);

		// email should be sanitised (trimmed + lowercased)
		assert.strictEqual(req.session.email, 'test@example.com');
		assert.strictEqual(service.db.case.findFirst.mock.callCount(), 1);
		assert.deepStrictEqual(service.db.case.findFirst.mock.calls[0].arguments[0], {
			where: { email: 'test@example.com', deletedDate: null },
			orderBy: { createdAt: 'desc' }
		});
		assert.strictEqual(service.db.oneTimePassword.upsert.mock.callCount(), 1);
		assert.strictEqual(service.notifyClient.sendAuthCode.mock.callCount(), 1);
		assert.strictEqual(service.notifyClient.sendAuthCode.mock.calls[0].arguments[2], 'portal-login:PLAN-123456');
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
		assert.strictEqual(data.pageHeading, 'Sign-in');
		assert.match(data.errors.email.msg, /something went wrong/i);
		assert.strictEqual(data.errorSummaryTitle, 'We could not sign you in');
		assert.strictEqual(service.logger.error.mock.callCount(), 1);
		assert.strictEqual(service.notifyClient.sendAuthCode.mock.callCount(), 0);
	});

	it('should still redirect when notify fails (fire-and-forget)', async () => {
		const service = createMockService();
		service.db.case.findFirst.mock.mockImplementation(async () => ({ id: 1, reference: 'PLAN-123456' }));
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
	it('should render page not found when no email in session', async () => {
		const service = createMockService();
		const handler = buildSubmitOtpPage(service);
		const req = createMockReq({}, {});
		const res = createMockRes();

		await handler(req, res);

		assert.strictEqual(res.status.mock.callCount(), 1);
		assert.strictEqual(res.status.mock.calls[0].arguments[0], 404);
		assert.strictEqual(res.render.mock.callCount(), 1);
		const [view, data] = res.render.mock.calls[0].arguments;
		assert.strictEqual(view, 'views/layouts/error');
		assert.strictEqual(data.pageTitle, 'Page not found');
		assert.strictEqual(service.db.oneTimePassword.findUnique.mock.callCount(), 0);
	});

	it('should render error when OTP is not provided', async () => {
		const service = createMockService();
		const handler = buildSubmitOtpPage(service);
		const req = createMockReq({ otp: '' }, { email: 'test@example.com' });
		const res = createMockRes();

		await handler(req, res);

		const data = assertRender(res, 'views/login/enter-otp.njk');
		assert.strictEqual(data.pageHeading, 'Enter your one-time password');
		assert.match(data.errors.otp.msg, /enter the code/i);
		assert.strictEqual(data.errorSummaryTitle, 'There is a problem');
		assert.strictEqual(service.db.oneTimePassword.findUnique.mock.callCount(), 0);
	});

	it('should allow the configured OTP bypass outside prod', async () => {
		const service = createMockService({
			environment: 'test',
			auth: { otpBypassCode: '12345' }
		});
		const handler = buildSubmitOtpPage(service);
		const req = createMockReq({ otp: '12345' }, { email: 'test@example.com' }, 'local-plans-portal-test.example.com');
		const res = createMockRes();

		await handler(req, res);

		assertRedirect(res, '/manage-local-plans/your-plans');
		assert.strictEqual(req.session.isAuthenticated, true);
		assert.strictEqual(req.session.authenticatedEmail, 'test@example.com');
		assert.strictEqual(req.session.email, undefined);
		assert.strictEqual(service.db.oneTimePassword.findUnique.mock.callCount(), 0);
	});

	it('should reject the OTP bypass when the email is not associated with an active case', async () => {
		const service = createMockService({
			environment: 'test',
			auth: { otpBypassCode: '12345' }
		});
		service.db.case.findFirst.mock.mockImplementation(async () => null);
		const handler = buildSubmitOtpPage(service);
		const req = createMockReq(
			{ otp: '12345' },
			{ email: 'unknown@example.com' },
			'local-plans-portal-test.example.com'
		);
		const res = createMockRes();

		await handler(req, res);

		assertRedirect(res, '/login/no-access');
		assert.strictEqual(req.session.isAuthenticated, undefined);
		assert.strictEqual(req.session.authenticatedEmail, undefined);
		assert.strictEqual(req.session.email, undefined);
		assert.deepStrictEqual(service.db.case.findFirst.mock.calls[0].arguments[0], {
			where: { email: 'unknown@example.com', deletedDate: null }
		});
		assert.strictEqual(service.db.oneTimePassword.findUnique.mock.callCount(), 0);
	});

	it('should reject OTP verification when the email is no longer associated with an active case', async () => {
		const service = createMockService();
		service.db.case.findFirst.mock.mockImplementation(async () => null);
		service.db.oneTimePassword.findUnique.mock.mockImplementation(async () => ({
			email: 'unknown@example.com',
			hashedOtp: 'unused',
			expiresAt: new Date(Date.now() + 60000),
			attempts: 0,
			lockedOutUntil: null
		}));
		const handler = buildSubmitOtpPage(service);
		const req = createMockReq(
			{ otp: 'ABCDEFGH' },
			{ email: 'unknown@example.com' },
			'local-plans-portal-prod.example.com'
		);
		const res = createMockRes();

		await handler(req, res);

		assertRedirect(res, '/login/no-access');
		assert.strictEqual(req.session.isAuthenticated, undefined);
		assert.strictEqual(req.session.authenticatedEmail, undefined);
		assert.strictEqual(req.session.email, undefined);
		assert.strictEqual(service.db.oneTimePassword.findUnique.mock.callCount(), 0);
	});

	it('should allow the configured OTP bypass when NODE_ENV is production in non-prod Azure', async () => {
		const service = createMockService({
			nodeEnv: 'production',
			environment: 'training',
			auth: { otpBypassCode: '12345' }
		});
		const handler = buildSubmitOtpPage(service);
		const req = createMockReq(
			{ otp: '12345' },
			{ email: 'test@example.com' },
			'local-plans-portal-training.example.com'
		);
		const res = createMockRes();

		await handler(req, res);

		assertRedirect(res, '/manage-local-plans/your-plans');
		assert.strictEqual(req.session.isAuthenticated, true);
		assert.strictEqual(req.session.authenticatedEmail, 'test@example.com');
		assert.strictEqual(req.session.email, undefined);
		assert.strictEqual(service.db.oneTimePassword.findUnique.mock.callCount(), 0);
	});

	it('should allow the local OTP fallback when running on localhost outside production', async () => {
		const service = createMockService();
		const handler = buildSubmitOtpPage(service);
		const req = createMockReq({ otp: '12345' }, { email: 'test@example.com' });
		const res = createMockRes();

		await handler(req, res);

		assertRedirect(res, '/manage-local-plans/your-plans');
		assert.strictEqual(req.session.isAuthenticated, true);
		assert.strictEqual(req.session.authenticatedEmail, 'test@example.com');
		assert.strictEqual(req.session.email, undefined);
		assert.strictEqual(service.db.oneTimePassword.findUnique.mock.callCount(), 0);
	});

	it('should not allow the configured OTP bypass in prod', async () => {
		const service = createMockService({
			environment: 'prod',
			auth: { otpBypassCode: '12345' }
		});
		service.db.oneTimePassword.findUnique.mock.mockImplementation(async () => null);
		const handler = buildSubmitOtpPage(service);
		const req = createMockReq({ otp: '12345' }, { email: 'test@example.com' }, 'local-plans-portal-prod.example.com');
		const res = createMockRes();

		await handler(req, res);

		const data = assertRender(res, 'views/login/enter-otp.njk');
		assert.strictEqual(data.errorSummaryTitle, 'There is a problem');
		assert.strictEqual(req.session.isAuthenticated, undefined);
		assert.strictEqual(service.db.oneTimePassword.findUnique.mock.callCount(), 1);
	});

	it('should not allow the OTP bypass when no bypass code is configured for a non-localhost host', async () => {
		const service = createMockService({
			environment: 'test',
			auth: { otpBypassCode: '' }
		});
		service.db.oneTimePassword.findUnique.mock.mockImplementation(async () => null);
		const handler = buildSubmitOtpPage(service);
		const req = createMockReq({ otp: '12345' }, { email: 'test@example.com' }, 'local-plans-portal-test.example.com');
		const res = createMockRes();

		await handler(req, res);

		const data = assertRender(res, 'views/login/enter-otp.njk');
		assert.strictEqual(data.errorSummaryTitle, 'There is a problem');
		assert.strictEqual(req.session.isAuthenticated, undefined);
		assert.strictEqual(service.db.oneTimePassword.findUnique.mock.callCount(), 1);
	});

	it('should not allow the local OTP fallback in production', async () => {
		const service = createMockService({ nodeEnv: 'production' });
		service.db.oneTimePassword.findUnique.mock.mockImplementation(async () => null);
		const handler = buildSubmitOtpPage(service);
		const req = createMockReq({ otp: '12345' }, { email: 'test@example.com' });
		const res = createMockRes();

		await handler(req, res);

		const data = assertRender(res, 'views/login/enter-otp.njk');
		assert.strictEqual(data.errorSummaryTitle, 'There is a problem');
		assert.strictEqual(req.session.isAuthenticated, undefined);
		assert.strictEqual(service.db.oneTimePassword.findUnique.mock.callCount(), 1);
	});

	it('should not allow the local OTP for non-localhost hosts outside production', async () => {
		const service = createMockService();
		service.db.oneTimePassword.findUnique.mock.mockImplementation(async () => null);
		const handler = buildSubmitOtpPage(service);
		const req = createMockReq({ otp: '12345' }, { email: 'test@example.com' }, 'example.com');
		const res = createMockRes();

		await handler(req, res);

		const data = assertRender(res, 'views/login/enter-otp.njk');
		assert.strictEqual(data.errorSummaryTitle, 'There is a problem');
		assert.strictEqual(req.session.isAuthenticated, undefined);
		assert.strictEqual(service.db.oneTimePassword.findUnique.mock.callCount(), 1);
	});

	it('should render error when no OTP record found in DB', async () => {
		const service = createMockService();
		service.db.oneTimePassword.findUnique.mock.mockImplementation(async () => null);

		const handler = buildSubmitOtpPage(service);
		const req = createMockReq({ otp: 'ABCDEFGH' }, { email: 'test@example.com' });
		const res = createMockRes();

		await handler(req, res);

		const data = assertRender(res, 'views/login/enter-otp.njk');
		assert.strictEqual(data.pageHeading, 'Enter your one-time password');
		assert.strictEqual(data.errors.otp.msg, 'Enter the code we sent to you');
		assert.strictEqual(data.errorSummaryTitle, 'There is a problem');
		assert.deepStrictEqual(data.errorSummary, [{ text: 'Enter the code we sent to you', href: '#otp' }]);
		assert.strictEqual(service.db.oneTimePassword.update.mock.callCount(), 0);
	});

	it('should not create an OTP or send email when requesting a new code for an unregistered address', async () => {
		const service = createMockService();
		service.db.case.findFirst.mock.mockImplementation(async () => null);
		const handler = buildRequestNewCode(service);
		const req = createMockReq({}, { email: 'unknown@example.com' });
		const res = createMockRes();

		await handler(req, res);

		assertRedirect(res, '/login/enter-code');
		assert.strictEqual(service.db.oneTimePassword.delete.mock.callCount(), 0);
		assert.strictEqual(service.db.oneTimePassword.create.mock.callCount(), 0);
		assert.strictEqual(service.notifyClient.sendAuthCode.mock.callCount(), 0);
	});

	it('should render lockout error when user is locked out', async () => {
		const service = createMockService({ nodeEnv: 'production' });
		service.db.oneTimePassword.findUnique.mock.mockImplementation(async () => ({
			email: 'test@example.com',
			hashedOtp: 'hashed',
			expiresAt: new Date(Date.now() + 60000),
			attempts: 3,
			lockedOutUntil: new Date(Date.now() + 60 * 60 * 1000)
		}));

		const handler = buildSubmitOtpPage(service);
		const req = createMockReq({ otp: 'ABCDEFGH' }, { email: 'test@example.com' });
		const res = createMockRes();

		await handler(req, res);

		const data = assertRender(res, 'views/login/enter-otp.njk');
		assert.strictEqual(data.pageHeading, 'Enter your one-time password');
		assert.match(data.errors.otp.msg, /locked out/i);
		assert.strictEqual(data.errorSummaryTitle, 'Your account is temporarily locked');
		assert.strictEqual(service.db.oneTimePassword.update.mock.callCount(), 0);
	});

	it('should render expiry error when OTP has expired', async () => {
		const service = createMockService();
		service.db.oneTimePassword.findUnique.mock.mockImplementation(async () => ({
			email: 'test@example.com',
			hashedOtp: 'hashed',
			expiresAt: new Date(Date.now() - 1000),
			attempts: 0,
			lockedOutUntil: null
		}));

		const handler = buildSubmitOtpPage(service);
		const req = createMockReq({ otp: 'ABCDEFGH' }, { email: 'test@example.com' });
		const res = createMockRes();

		await handler(req, res);

		const data = assertRender(res, 'views/login/enter-otp.njk');
		assert.strictEqual(data.pageHeading, 'Enter your one-time password');
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
			lockedOutUntil: null
		}));
		service.db.oneTimePassword.update.mock.mockImplementation(async () => ({ attempts: 1 }));

		const handler = buildSubmitOtpPage(service);
		const req = createMockReq({ otp: 'WRONGCODE' }, { email: 'test@example.com' });
		const res = createMockRes();

		await handler(req, res);

		assert.strictEqual(service.db.oneTimePassword.update.mock.callCount(), 1);
		assert.strictEqual(res.render.mock.callCount(), 1);
		const [, data] = res.render.mock.calls[0].arguments;
		assert.strictEqual(data.pageHeading, 'Enter your one-time password');
		assert.match(data.errors.otp.msg, /Enter the code we sent to you/i);
		assert.strictEqual(data.errorSummaryTitle, 'There is a problem');
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
			lockedOutUntil: null
		}));
		let updateCallCount = 0;
		service.db.oneTimePassword.update.mock.mockImplementation(async () => {
			updateCallCount++;
			if (updateCallCount === 1) return { attempts: 3 };
			return {};
		});

		const handler = buildSubmitOtpPage(service);
		const req = createMockReq({ otp: 'WRONGCODE' }, { email: 'test@example.com' });
		const res = createMockRes();

		await handler(req, res);

		assert.strictEqual(service.db.oneTimePassword.update.mock.callCount(), 2);
		const [, data] = res.render.mock.calls[0].arguments;
		assert.strictEqual(data.pageHeading, 'Enter your one-time password');
		assert.match(data.errors.otp.msg, /locked out/i);
		assert.strictEqual(data.errorSummaryTitle, 'Your account is temporarily locked');
	});

	it('should redirect to home on successful OTP verification and clear session email', async () => {
		const bcrypt = await import('bcrypt');
		const hashedOtp = await bcrypt.hash('ABCDEFGH', 10);

		const service = createMockService();
		service.db.oneTimePassword.findUnique.mock.mockImplementation(async () => ({
			email: 'test@example.com',
			hashedOtp,
			expiresAt: new Date(Date.now() + 60000),
			attempts: 0,
			lockedOutUntil: null
		}));
		service.db.oneTimePassword.update.mock.mockImplementation(async () => ({}));

		const handler = buildSubmitOtpPage(service);
		const req = createMockReq({ otp: 'ABCDEFGH' }, { email: 'test@example.com' });
		const res = createMockRes();

		await handler(req, res);

		assertRedirect(res, '/manage-local-plans/your-plans');
		assert.strictEqual(req.session.isAuthenticated, true);
		assert.strictEqual(req.session.authenticatedEmail, 'test@example.com');
		assert.strictEqual(req.session.email, undefined);
		assert.strictEqual(service.db.oneTimePassword.update.mock.callCount(), 1);
		const updateArgs = service.db.oneTimePassword.update.mock.calls[0].arguments[0];
		assert.strictEqual(updateArgs.data.attempts, 0);
		assert.strictEqual(updateArgs.data.lockedOutUntil, null);
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
		assert.strictEqual(data.pageHeading, 'Enter your one-time password');
		assert.match(data.errors.otp.msg, /something went wrong/i);
		assert.strictEqual(data.errorSummaryTitle, 'We could not verify your code');
		assert.strictEqual(service.logger.error.mock.callCount(), 1);
		const logArgs = service.logger.error.mock.calls[0].arguments;
		assert.strictEqual(logArgs[0], 'Error during OTP verification');
		assert.strictEqual(logArgs.length, 1);
	});
});

describe('buildEnterOtpPage', () => {
	it('should render page not found when no email in session', async () => {
		const handler = buildEnterOtpPage();
		const req = createMockReq({}, {});
		const res = createMockRes();

		await handler(req, res);

		assert.strictEqual(res.status.mock.callCount(), 1);
		assert.strictEqual(res.status.mock.calls[0].arguments[0], 404);
		assert.strictEqual(res.render.mock.callCount(), 1);
		const [view, data] = res.render.mock.calls[0].arguments;
		assert.strictEqual(view, 'views/layouts/error');
		assert.strictEqual(data.pageTitle, 'Page not found');
	});

	it('should render enter-otp page when email is in session', async () => {
		const handler = buildEnterOtpPage();
		const req = createMockReq({}, { email: 'test@example.com' });
		const res = createMockRes();

		await handler(req, res);

		assertRender(res, 'views/login/enter-otp.njk', (data) => {
			assert.strictEqual(data.pageHeading, 'Enter your one-time password');
			assert.strictEqual(data.userEmail, 'test@example.com');
		});
	});
});

describe('resend session state', () => {
	it('shows the new-code message once after a successful resend', async () => {
		const service = createMockService();
		const req = createMockReq({}, { email: 'test@example.com' });
		const resendRes = createMockRes();

		await buildRequestNewCode(service)(req, resendRes);

		assertRedirect(resendRes, '/login/enter-code');
		assert.strictEqual(req.session.caseReference, 'test@example.com');
		assert.strictEqual(req.session.showNewCodeMessage, true);

		const enterRes = createMockRes();
		await buildEnterOtpPage()(req, enterRes);
		assert.strictEqual(assertRender(enterRes, 'views/login/enter-otp.njk').showNewCodeMessage, true);
		assert.strictEqual(req.session.showNewCodeMessage, undefined);
	});

	it('does not consume the message if the login email is missing', async () => {
		const req = createMockReq({}, { showNewCodeMessage: true });
		const res = createMockRes();

		await buildEnterOtpPage()(req, res);

		assert.strictEqual(res.status.mock.calls[0].arguments[0], 404);
		assert.strictEqual(req.session.showNewCodeMessage, true);
	});
});

describe('login view models', () => {
	const pageNotFoundModel = {
		pageTitle: 'Page not found',
		messages: [
			'If you typed the web address, check it is correct.',
			'If you pasted the web address, check you copied the entire address.'
		]
	};

	it('should pass the email page model', async () => {
		const res = createMockRes();

		await buildEnterEmailPage()(createMockReq(), res);

		assert.deepStrictEqual(assertRender(res, 'views/login/enter-email-page.njk'), {
			pageTitle: 'Sign-in',
			pageHeading: 'Sign-in',
			emailQuestionText: 'What is your email address?',
			backLinkUrl: '/'
		});
	});

	it('should pass the email page model with errors when the email is missing', async () => {
		const res = createMockRes();

		await buildSubmitEmailPage(createMockService())(createMockReq({ email: '' }), res);

		assert.deepStrictEqual(assertRender(res, 'views/login/enter-email-page.njk'), {
			pageTitle: 'Sign-in',
			pageHeading: 'Sign-in',
			emailQuestionText: 'What is your email address?',
			backLinkUrl: '/',
			errors: { email: { msg: 'Enter an email address in the correct format, like name@example.com' } },
			errorSummaryTitle: 'There is a problem',
			errorSummary: [{ text: 'Enter an email address in the correct format, like name@example.com', href: '#email' }]
		});
	});

	it('should let view data override the email page model', async () => {
		const res = createMockRes();

		await buildEnterEmailPage({ backLinkUrl: '/other' })(createMockReq(), res);

		assert.strictEqual(assertRender(res, 'views/login/enter-email-page.njk').backLinkUrl, '/other');
	});

	it('should pass the OTP page model without the new-code banner', async () => {
		const res = createMockRes();

		await buildEnterOtpPage()(createMockReq({}, { email: 'test@example.com' }), res);

		assert.deepStrictEqual(assertRender(res, 'views/login/enter-otp.njk'), {
			pageTitle: 'Enter your one-time password',
			pageHeading: 'Enter your one-time password',
			backLinkUrl: '/login',
			userEmail: 'test@example.com',
			showNewCodeMessage: false
		});
	});

	it('should pass the new-code banner flag to the OTP page and clear it from the session', async () => {
		const req = createMockReq({}, { email: 'test@example.com', showNewCodeMessage: true });
		const res = createMockRes();

		await buildEnterOtpPage()(req, res);

		assert.strictEqual(assertRender(res, 'views/login/enter-otp.njk').showNewCodeMessage, true);
		assert.strictEqual(req.session.showNewCodeMessage, undefined);
	});

	it('should pass the OTP page model with errors when the code is missing', async () => {
		const res = createMockRes();
		const req = createMockReq({ otp: '' }, { email: 'test@example.com' });

		await buildSubmitOtpPage(createMockService())(req, res);

		assert.deepStrictEqual(assertRender(res, 'views/login/enter-otp.njk'), {
			pageTitle: 'Enter your one-time password',
			pageHeading: 'Enter your one-time password',
			errors: { otp: { msg: 'Enter the code we sent to you' } },
			errorSummaryTitle: 'There is a problem',
			errorSummary: [{ text: 'Enter the code we sent to you', href: '#otp' }],
			backLinkUrl: '/login',
			userEmail: 'test@example.com'
		});
	});

	it('should pass the OTP page model without a title when requesting a new code fails', async () => {
		const service = createMockService();
		service.db.case.findFirst.mock.mockImplementation(async () => {
			throw new Error('DB error');
		});
		const res = createMockRes();

		await buildRequestNewCode(service)(createMockReq({}, { email: 'test@example.com' }), res);

		assert.deepStrictEqual(assertRender(res, 'views/login/enter-otp.njk'), {
			errors: { otp: { msg: 'Something went wrong. Please try again later.' } },
			errorSummaryTitle: 'We could not send a new code',
			errorSummary: [{ text: 'Something went wrong. Please try again later.', href: '#otp' }],
			backLinkUrl: '/login',
			userEmail: 'test@example.com'
		});
	});

	it('should pass the page not found model from the OTP pages', async () => {
		const enterRes = createMockRes();
		const submitRes = createMockRes();

		await buildEnterOtpPage()(createMockReq({}, {}), enterRes);
		await buildSubmitOtpPage(createMockService())(createMockReq({}, {}), submitRes);

		assert.deepStrictEqual(assertRender(enterRes, 'views/layouts/error'), pageNotFoundModel);
		assert.deepStrictEqual(assertRender(submitRes, 'views/layouts/error'), pageNotFoundModel);
	});

	it('should pass the no access page model', async () => {
		const res = createMockRes();

		await buildNoAccessPage()({}, res);

		assert.deepStrictEqual(assertRender(res, 'views/login/no-access.njk'), {
			pageTitle: 'You do not have access to this service'
		});
	});
});
