import type { AsyncRequestHandler } from '@pins/local-plans-lib/util/async-handler.ts';
import type { PortalService } from '#service';
import { expressValidationErrorsToGovUkErrorList } from '@planning-inspectorate/dynamic-forms';
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
		// check Email exist
		const { email } = req.body;
		if (!email) {
			logger.info(`Email address now provided - ${email}`);
			req.body.errors = {
				email: { msg: 'Enter your email address' }
			};
			buildEnterEmailPage();
			return;
		}

		//generate OTP
		const OTP_LENGTH = 8;
		const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
		const bytes = new Uint8Array(OTP_LENGTH);
		crypto.getRandomValues(bytes);
		const otp = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');

		const SALT_ROUNDS = 10;
		const hashedOtp = await bcrypt.hash(otp, SALT_ROUNDS);
		const expiresAt = new Date(Date.now() + 20 * 60 * 1000);

		try {
			const emailIsAssociatedToACase = await db.case.findFirst({ where: { email } });
			if (!emailIsAssociatedToACase) {
				return res.render('views/login/enter-email-page.njk', {
					errors: { email: { msg: 'Invalid email address.' } }
				});
			}

			const otpRecord = await db.oneTimePassword.findUnique({
				where: { email }
			});

			if (otpRecord && otpRecord.locked_out_until && otpRecord.locked_out_until.getTime() > Date.now()) {
				return res.render('views/login/enter-email-page.njk', {
					errors: { email: { msg: 'You are locked out for 24 hours for too many failed login attempts' } }
				});
			} else if (otpRecord && otpRecord.locked_out_until && otpRecord.locked_out_until.getTime() < Date.now()) {
				await db.oneTimePassword.update({
					where: { email },
					data: { attempts: 0, locked_out_until: null }
				});
			}

			// create a new OTP record
			if (
				!otpRecord ||
				otpRecord.attempts < MAX_ATTEMPTS ||
				(otpRecord.locked_out_until && otpRecord.locked_out_until.getTime() < Date.now())
			) {
				await db.oneTimePassword.upsert({
					where: { email },
					update: { hashedOtp, expiresAt, createdAt: new Date() },
					create: { email, hashedOtp, attempts: 0, expiresAt }
				});
			}

			// go to OTP page
			req.session.email = email;

			await sendAuthCodeNotification(service, email, { authCode: otp, expiryMinutes: '20' });

			return res.redirect(`${req.baseUrl}/enter-code`);
		} catch (error) {
			logger.error(error);
			req.body.errors = {
				otpError: { msg: error }
			};
			req.body.errorSummary = expressValidationErrorsToGovUkErrorList(req.body.errors);

			return res.render('views/login/enter-email-page.njk', {
				pageTitle: 'Sign-in',
				emailQuestionText: 'Email address',
				backLinkUrl: `/`,
				errors: req.body.errors,
				errorSummary: req.body.errorSummary
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
		if (!otp) {
			return res.render('views/login/enter-otp.njk', {
				errors: { otp: { msg: 'Enter the code we sent to your email address' } }
			});
		}

		const otpRecord = await db.oneTimePassword.findUnique({
			where: { email }
		});
		// no OTP exists
		if (!otpRecord) {
			return res.render('views/login/enter-otp.njk', {
				errors: { otp: { msg: 'We could not find an OTP for your email address, go back and try again.' } }
			});
		}

		// user is locked out
		if (otpRecord.locked_out_until && otpRecord.locked_out_until.getTime() > Date.now()) {
			logger.info(`${otpRecord.email} is locked out - too many failed attempts`);
			return res.render('views/login/enter-otp.njk', {
				errors: { otp: { msg: `locked out for 24 hours` } }
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
				errors: { otp: { msg: 'Your password has expired, go back to request a new one.' } }
			});
		}

		const otpCodesMatch = await bcrypt.compare(otp.trim().toUpperCase(), otpRecord?.hashedOtp);
		if (!otpCodesMatch) {
			logger.info(`${email} - OTP code does not match`);
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
					errors: { otp: { msg: `Too many failed attempts, you are locked out for 24 hours` } }
				});
			}
			return res.render('views/login/enter-otp.njk', {
				errors: { otp: { msg: 'The code you entered is incorrect' } }
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

		// TODO login
		logger.info('OTP success');
		return res.redirect(`/`);
	};
}

export function buildNoAccessPage(): AsyncRequestHandler {
	return async (req, res) => {
		return res.render('views/login/no-access.njk', {
			pageTitle: 'You do not have access to this service'
		});
	};
}
