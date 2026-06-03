import type { AsyncRequestHandler } from '@pins/local-plans-lib/util/async-handler.ts';
import type { PortalService } from '#service';
import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { clearSessionData, readSessionData } from '@pins/local-plans-lib/util/session.ts';
import { sendAuthCodeNotification } from '../auth/send-code.ts';

const MAX_ATTEMPTS = 3;

export function buildEnterEmailPage(viewData = {}): AsyncRequestHandler {
	return async (req: Request, res: Response) => {
		return res.render('views/login/enter-email-page.njk', {
			pageTitle: 'Sign-in',
			emailQuestionText: 'Email address',
			caseNumberQuestionText: 'Case number',
			caseNumberHintText:
				'You can find this in the email inviting you to sign in to this service. For example, ref/0000001',
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
				emailQuestionText: 'Email address',
				caseNumberQuestionText: 'Case number',
				caseNumberHintText:
					'You can find this in the email inviting you to sign in to this service. For example, ref/0000001',
				backLinkUrl: `/`,
				errors: { email: { msg: 'Enter your email address' } },
				errorSummaryTitle: 'You have not entered your email address',
				errorSummary: [{ text: 'Enter your email address', href: '#email' }]
			});
		}

		const sanitisedEmail = email.trim().toLowerCase();

		try {
			const emailIsAssociatedToACase = await db.case.findFirst({ where: { email: sanitisedEmail } });
			if (!emailIsAssociatedToACase) {
				logger.info({ email: sanitisedEmail }, 'Login attempt with unrecognised email');
				return res.render('views/login/enter-email-page.njk', {
					errors: { email: { msg: 'Enter an email address linked to a case on this service' } },
					errorSummaryTitle: 'We did not recognise that email address',
					errorSummary: [{ text: 'Enter an email address linked to a case on this service', href: '#email' }]
				});
			}

			const otpRecord = await db.oneTimePassword.findUnique({
				where: { email: sanitisedEmail }
			});

			if (otpRecord && otpRecord.locked_out_until && otpRecord.locked_out_until.getTime() > Date.now()) {
				logger.info({ email: sanitisedEmail }, 'Login attempt while locked out');
				return res.render('views/login/enter-email-page.njk', {
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

			await sendAuthCodeNotification(service, sanitisedEmail, { authCode: otp, expiryMinutes: '20' });

			return res.redirect(`${req.baseUrl}/enter-code`);
		} catch (error) {
			logger.error({ error, email: sanitisedEmail }, 'Error during login email submission');

			return res.render('views/login/enter-email-page.njk', {
				pageTitle: 'Sign-in',
				emailQuestionText: 'Email address',
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
		const showNewCodeMessage = readSessionData(req, req.session.caseReference as string, 'showNewCodeMessage', false);
		clearSessionData(req, req.session.caseReference as string, 'showNewCodeMessage');

		return res.render('views/login/enter-otp.njk', {
			questionText: 'Enter the code we sent to your email address',
			backLinkUrl: `${req.baseUrl}`,
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
				errors: { otp: { msg: 'Enter the code we sent to your email address' } },
				errorSummaryTitle: 'You have not entered a code',
				errorSummary: [{ text: 'Enter the code we sent to your email address', href: '#otp' }]
			});
		}

		try {
			const otpRecord = await db.oneTimePassword.findUnique({
				where: { email }
			});
			// no OTP exists
			if (!otpRecord) {
				return res.render('views/login/enter-otp.njk', {
					errors: { otp: { msg: 'We could not find a code for your email address. Go back and try again.' } },
					errorSummaryTitle: 'We could not verify your code',
					errorSummary: [
						{ text: 'We could not find a code for your email address. Go back and try again.', href: '#otp' }
					]
				});
			}

			// user is locked out
			if (otpRecord.locked_out_until && otpRecord.locked_out_until.getTime() > Date.now()) {
				logger.info({ email }, 'User is locked out - too many failed attempts');
				return res.render('views/login/enter-otp.njk', {
					errors: { otp: { msg: 'You have been locked out for 24 hours due to too many failed attempts' } },
					errorSummaryTitle: 'Your account is temporarily locked',
					errorSummary: [
						{ text: 'You have been locked out for 24 hours due to too many failed attempts', href: '#otp' }
					]
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
					errors: { otp: { msg: 'Your code has expired. Go back to request a new one.' } },
					errorSummaryTitle: 'Your code has expired',
					errorSummary: [{ text: 'Your code has expired. Go back to request a new one.', href: '#otp' }]
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
						errors: { otp: { msg: 'Too many failed attempts. You are locked out for 24 hours.' } },
						errorSummaryTitle: 'Your account is temporarily locked',
						errorSummary: [{ text: 'Too many failed attempts. You are locked out for 24 hours.', href: '#otp' }]
					});
				}
				return res.render('views/login/enter-otp.njk', {
					errors: { otp: { msg: 'The code you entered is incorrect' } },
					errorSummaryTitle: 'The code you entered is incorrect',
					errorSummary: [{ text: 'The code you entered is incorrect', href: '#otp' }]
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
			return res.redirect(`/`);
		} catch (error) {
			logger.error({ error, email }, 'Error during OTP verification');
			return res.render('views/login/enter-otp.njk', {
				errors: { otp: { msg: 'Something went wrong. Please try again later.' } },
				errorSummaryTitle: 'We could not verify your code',
				errorSummary: [{ text: 'Something went wrong. Please try again later.', href: '#otp' }]
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
