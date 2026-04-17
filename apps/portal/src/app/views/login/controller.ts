import type { AsyncRequestHandler } from '@pins/local-plans-lib/util/async-handler.ts';
import type { PortalService } from '#service';
import { expressValidationErrorsToGovUkErrorList } from '@planning-inspectorate/dynamic-forms';
import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { clearSessionData, readSessionData } from '@pins/local-plans-lib/util/session.ts';
import { sendAuthCodeNotification } from '../auth/send-code.ts';

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
		}

		//generate OTP
		const OTP_LENGTH = 8;
		const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
		const bytes = new Uint8Array(OTP_LENGTH);
		crypto.getRandomValues(bytes);
		const otp = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');
		logger.info(`OTP ${otp}`);

		const SALT_ROUNDS = 10;
		const hashedOtp = await bcrypt.hash(otp, SALT_ROUNDS);
		const expiresAt = new Date(Date.now() + 20 * 60 * 1000);

		try {
			const emailIsAssociatedToACase = await db.case.findFirst({ where: { email } });
			if (!emailIsAssociatedToACase) throw new Error('enter a valid email address');
			// upsert OTP record
			const MAX_ATTEMPTS = 3;
			const current_attempts = await db.oneTimePassword.findUnique({
				where: { email }
			});
			if (current_attempts === null || current_attempts.attempts < MAX_ATTEMPTS) {
				await db.oneTimePassword.upsert({
					where: { email },
					update: { hashedOtp, attempts: { increment: 1 } },
					create: { email, hashedOtp, attempts: 0, expiresAt }
				});
			} else if (current_attempts.attempts >= MAX_ATTEMPTS) throw new Error('you have requested too many password');

			// go to OTP page
			req.session.email = email;

			await sendAuthCodeNotification(service, email, { authCode: otp, expiryMinutes: '30' });

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

		const otpRecord = await db.oneTimePassword.findUnique({
			where: { email }
		});

		if (!otpRecord) return res.redirect(`${req.baseUrl}`);

		const { otp } = req.body;

		const otpCodesMatch = await bcrypt.compare(otp.trim().toUpperCase(), otpRecord?.hashedOtp);
		if (!otpCodesMatch) {
			logger.error('codes do not match');
			res.redirect(`${req.baseUrl}/enter-code`);
		} else res.redirect(`/`);
	};
}

export function buildNoAccessPage(): AsyncRequestHandler {
	return async (req, res) => {
		return res.render('views/login/no-access.njk', {
			pageTitle: 'You do not have access to this service'
		});
	};
}
