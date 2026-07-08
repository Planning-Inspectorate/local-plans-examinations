import type { AsyncRequestHandler } from '@pins/local-plans-lib/util/async-handler.ts';
import type { PortalService } from '#service';
import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { sendAuthCodeNotification } from '../auth/send-code.ts';

const MAX_ATTEMPTS = 3;

export function buildEnterEmailPage(viewData = {}): AsyncRequestHandler {
	return async (req: Request, res: Response) => {
		return res.render('views/login/enter-email-page.njk', {
			pageTitle: 'Sign-in',
			pageHeading: 'Sign-in',
			emailQuestionText: 'What is your email address?',
			backLinkUrl: `/`,
			...viewData
		});
	};
}

export function buildSubmitEmailPage(service: PortalService): AsyncRequestHandler {
	const { logger, db } = service;
	return async (req: Request, res: Response) => {
		const { email } = req.body;

		if (!email || typeof email !== 'string' || email.trim().length === 0) {
			logger.info('Email address not provided');
			return res.render('views/login/enter-email-page.njk', {
				pageTitle: 'Sign-in',
				pageHeading: 'Sign-in',
				emailQuestionText: 'What is your email address?',
				backLinkUrl: `/`,
				errors: { email: { msg: 'Enter your email address' } },
				errorSummaryTitle: 'You have not entered your email address',
				errorSummary: [{ text: 'Enter your email address', href: '#email' }]
			});
		}

		const sanitisedEmail = email.trim().toLowerCase();

		// Basic email format validation - must contain @ and a dot after @
		const atIndex = sanitisedEmail.indexOf('@');
		const dotIndex = sanitisedEmail.lastIndexOf('.');
		if (atIndex < 1 || dotIndex <= atIndex + 1 || dotIndex === sanitisedEmail.length - 1) {
			logger.info({ email: sanitisedEmail }, 'Invalid email format');
			return res.render('views/login/enter-email-page.njk', {
				pageTitle: 'Sign-in',
				pageHeading: 'Sign-in',
				emailQuestionText: 'What is your email address?',
				backLinkUrl: `/`,
				errors: { email: { msg: 'Enter the valid email address your reference number was sent to' } },
				errorSummaryTitle: 'Enter a valid email address',
				errorSummary: [{ text: 'Enter the valid email address your reference number was sent to', href: '#email' }]
			});
		}

		try {
			const emailIsAssociatedToACase = await db.case.findFirst({ where: { email: sanitisedEmail } });
			if (!emailIsAssociatedToACase) {
				logger.info({ email: sanitisedEmail }, 'Login attempt with unrecognised email');
				return res.render('views/login/enter-email-page.njk', {
					pageTitle: 'Sign-in',
					pageHeading: 'Sign-in',
					emailQuestionText: 'What is your email address?',
					backLinkUrl: `/`,
					errors: { email: { msg: 'Enter an email address linked to a case on this service' } },
					errorSummaryTitle: 'We did not recognise that email address',
					errorSummary: [{ text: 'Enter an email address linked to a case on this service', href: '#email' }]
				});
			}

			const otpRecord = await db.oneTimePassword.findUnique({
				where: { email: sanitisedEmail }
			});

			if (
				process.env.NODE_ENV === 'production' &&
				otpRecord &&
				otpRecord.locked_out_until &&
				otpRecord.locked_out_until.getTime() > Date.now()
			) {
				logger.info({ email: sanitisedEmail }, 'Login attempt while locked out');
				return res.render('views/login/enter-email-page.njk', {
					pageTitle: 'Sign-in',
					pageHeading: 'Sign-in',
					emailQuestionText: 'What is your email address?',
					backLinkUrl: `/`,
					errors: { email: { msg: 'You have been locked out for 24 hours due to too many failed attempts' } },
					errorSummaryTitle: 'Your account is temporarily locked',
					errorSummary: [
						{ text: 'You have been locked out for 24 hours due to too many failed attempts', href: '#email' }
					]
				});
			} else if (otpRecord && otpRecord.locked_out_until && otpRecord.locked_out_until.getTime() < Date.now()) {
				await db.oneTimePassword.update({
					where: { email: sanitisedEmail },
					data: { attempts: 0, locked_out_until: null }
				});
			}

			// generate OTP
			const OTP_LENGTH = 8;
			const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
			const bytes = new Uint8Array(OTP_LENGTH);
			crypto.getRandomValues(bytes);
			const otp = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');

			const SALT_ROUNDS = 10;
			const hashedOtp = await bcrypt.hash(otp, SALT_ROUNDS);
			const expiresAt = new Date(Date.now() + 20 * 60 * 1000);

			// create a new OTP record
			if (
				!otpRecord ||
				otpRecord.attempts < MAX_ATTEMPTS ||
				(otpRecord.locked_out_until && otpRecord.locked_out_until.getTime() < Date.now())
			) {
				await db.oneTimePassword.upsert({
					where: { email: sanitisedEmail },
					update: { hashedOtp, expiresAt, createdAt: new Date() },
					create: { email: sanitisedEmail, hashedOtp, attempts: 0, expiresAt }
				});
			}

			req.session.email = sanitisedEmail;

			const signInUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}/enter-code`;

			// Send OTP email - don't block the redirect if it fails
			sendAuthCodeNotification(service, sanitisedEmail, {
				authCode: otp,
				expiryMinutes: '20',
				caseReference: emailIsAssociatedToACase.reference,
				signInUrl
			}).catch((error) => {
				logger.error({ error, email: sanitisedEmail }, 'Failed to send OTP email');
			});

			logger.info({ email: sanitisedEmail, otp }, 'OTP generated for user');

			return res.redirect(`${req.baseUrl}/enter-code`);
		} catch (error) {
			logger.error({ error, email: sanitisedEmail }, 'Error during login email submission');

			return res.render('views/login/enter-email-page.njk', {
				pageTitle: 'Sign-in',
				pageHeading: 'Sign-in',
				emailQuestionText: 'What is your email address?',
				backLinkUrl: `/`,
				errors: { email: { msg: 'Something went wrong. Please try again later.' } },
				errorSummaryTitle: 'We could not sign you in',
				errorSummary: [{ text: 'Something went wrong. Please try again later.', href: '#email' }]
			});
		}
	};
}

export function buildEnterOtpPage(viewData = {}): AsyncRequestHandler {
	return async (req, res) => {
		const showNewCodeMessage = req.session.showNewCodeMessage || false;
		delete req.session.showNewCodeMessage;

		return res.render('views/login/enter-otp.njk', {
			pageTitle: 'Enter your one-time password',
			pageHeading: 'Enter your one-time password',
			backLinkUrl: `${req.baseUrl}`,
			userEmail: req.session.email,
			showNewCodeMessage,
			...viewData
		});
	};
}

export function buildSubmitOtpPage(service: PortalService) {
	return async (req: Request, res: Response) => {
		const { db, logger } = service;
		const email = req.session.email;

		if (!email) {
			return res.redirect(`${req.baseUrl}`);
		}

		const { otp } = req.body;
		if (!otp || typeof otp !== 'string' || otp.trim().length === 0) {
			return res.render('views/login/enter-otp.njk', {
				pageTitle: 'Enter your one-time password',
				pageHeading: 'Enter your one-time password',
				errors: { otp: { msg: 'Enter the code we sent to your email address' } },
				errorSummaryTitle: 'You have not entered a code',
				errorSummary: [{ text: 'Enter the code we sent to your email address', href: '#otp' }],
				backLinkUrl: `${req.baseUrl}`,
				userEmail: email
			});
		}

		try {
			const otpRecord = await db.oneTimePassword.findUnique({
				where: { email }
			});
			// no OTP exists
			if (!otpRecord) {
				return res.render('views/login/enter-otp.njk', {
					pageTitle: 'Enter your one-time password',
					pageHeading: 'Enter your one-time password',
					errors: { otp: { msg: 'Enter the code we sent to your email address' } },
					errorSummaryTitle: 'We could not verify your code',
					errorSummary: [
						{ text: 'We could not find a code for your email address. Go back and try again.', href: '#otp' }
					],
					backLinkUrl: `${req.baseUrl}`,
					userEmail: email
				});
			}

			// user is locked out
			if (
				process.env.NODE_ENV === 'production' &&
				otpRecord.locked_out_until &&
				otpRecord.locked_out_until.getTime() > Date.now()
			) {
				logger.info({ email }, 'User is locked out - too many failed attempts');
				return res.render('views/login/enter-otp.njk', {
					pageTitle: 'Enter your one-time password',
					pageHeading: 'Enter your one-time password',
					errors: { otp: { msg: 'You have been locked out for 24 hours due to too many failed attempts' } },
					errorSummaryTitle: 'Your account is temporarily locked',
					errorSummary: [
						{ text: 'You have been locked out for 24 hours due to too many failed attempts', href: '#otp' }
					],
					backLinkUrl: `${req.baseUrl}`,
					userEmail: email
				});
			}

			// reset lockout when lock out time has expired
			if (otpRecord.locked_out_until) {
				await db.oneTimePassword.update({
					where: { email },
					data: { attempts: 0, locked_out_until: null }
				});
			}

			// OTP has expired
			if (otpRecord.expiresAt.getTime() < Date.now()) {
				return res.render('views/login/enter-otp.njk', {
					pageTitle: 'Enter your one-time password',
					pageHeading: 'Enter your one-time password',
					errors: { otp: { msg: 'Your code has expired. Go back to request a new one.' } },
					errorSummaryTitle: 'Your code has expired',
					errorSummary: [{ text: 'Your code has expired. Go back to request a new one.', href: '#otp' }],
					backLinkUrl: `${req.baseUrl}`,
					userEmail: email
				});
			}

			const otpCodesMatch = await bcrypt.compare(otp.trim().toUpperCase(), otpRecord.hashedOtp);
			if (!otpCodesMatch) {
				logger.info({ email }, 'OTP code does not match');
				// increment attempts
				const updateOtpAttempts = await db.oneTimePassword.update({
					where: { email },
					data: { attempts: { increment: 1 } }
				});
				if (updateOtpAttempts.attempts >= MAX_ATTEMPTS) {
					await db.oneTimePassword.update({
						where: { email },
						data: { locked_out_until: new Date(Date.now() + 24 * 60 * 60 * 1000) }
					});
					return res.render('views/login/enter-otp.njk', {
						pageTitle: 'Enter your one-time password',
						pageHeading: 'Enter your one-time password',
						errors: { otp: { msg: 'Too many failed attempts. You are locked out for 24 hours.' } },
						errorSummaryTitle: 'Your account is temporarily locked',
						errorSummary: [{ text: 'Too many failed attempts. You are locked out for 24 hours.', href: '#otp' }],
						backLinkUrl: `${req.baseUrl}`,
						userEmail: email
					});
				}
				return res.render('views/login/enter-otp.njk', {
					pageTitle: 'Enter your one-time password',
					pageHeading: 'Enter your one-time password',
					errors: { otp: { msg: 'Enter the code we sent to your email address' } },
					errorSummaryTitle: 'The code you entered is incorrect',
					errorSummary: [{ text: 'Enter the code we sent to your email address', href: '#otp' }],
					backLinkUrl: `${req.baseUrl}`,
					userEmail: email
				});
			}

			// reset locked out timestamp and attempts counter
			await db.oneTimePassword.update({
				where: { email },
				data: {
					attempts: 0,
					locked_out_until: null
				}
			});

			logger.info({ email }, 'OTP verification success');
			return res.redirect('/manage-local-plans/your-plans');
		} catch (error) {
			logger.error({ error, email }, 'Error during OTP verification');
			return res.render('views/login/enter-otp.njk', {
				pageTitle: 'Enter your one-time password',
				pageHeading: 'Enter your one-time password',
				errors: { otp: { msg: 'Something went wrong. Please try again later.' } },
				errorSummaryTitle: 'We could not verify your code',
				errorSummary: [{ text: 'Something went wrong. Please try again later.', href: '#otp' }],
				backLinkUrl: `${req.baseUrl}`,
				userEmail: email
			});
		}
	};
}

export function buildRequestNewCode(service: PortalService): AsyncRequestHandler {
	const { logger, db } = service;
	return async (req: Request, res: Response) => {
		const email = req.session.email;

		if (!email) {
			return res.redirect(`${req.baseUrl}`);
		}

		try {
			// Delete the existing OTP record to invalidate it
			await db.oneTimePassword.delete({
				where: { email }
			});

			// Generate a new OTP
			const OTP_LENGTH = 8;
			const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
			const bytes = new Uint8Array(OTP_LENGTH);
			crypto.getRandomValues(bytes);
			const otp = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');

			const SALT_ROUNDS = 10;
			const hashedOtp = await bcrypt.hash(otp, SALT_ROUNDS);
			const expiresAt = new Date(Date.now() + 20 * 60 * 1000);

			// Create a new OTP record
			await db.oneTimePassword.create({
				data: {
					email,
					hashedOtp,
					attempts: 0,
					expiresAt
				}
			});

			// Send the new OTP email
			const caseRecord = await db.case.findFirst({ where: { email } });
			const signInUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}/enter-code`;
			await sendAuthCodeNotification(service, email, {
				authCode: otp,
				expiryMinutes: '20',
				caseReference: caseRecord?.reference || '',
				signInUrl
			});

			logger.info({ email }, 'New OTP requested and sent');

			// Set session flag to show success message
			req.session.caseReference = email;
			req.session.showNewCodeMessage = true;

			return res.redirect(`${req.baseUrl}/enter-code`);
		} catch (error) {
			logger.error({ error, email }, 'Error during new code request');
			return res.render('views/login/enter-otp.njk', {
				errors: { otp: { msg: 'Something went wrong. Please try again later.' } },
				errorSummaryTitle: 'We could not send a new code',
				errorSummary: [{ text: 'Something went wrong. Please try again later.', href: '#otp' }],
				backLinkUrl: `${req.baseUrl}`,
				userEmail: email
			});
		}
	};
}

export function buildNoAccessPage(): AsyncRequestHandler {
	return async (req, res) => {
		return res.render('views/login/no-access.njk', {
			pageTitle: 'You do not have access to this service'
		});
	};
}
