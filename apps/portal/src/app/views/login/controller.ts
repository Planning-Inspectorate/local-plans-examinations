import type { AsyncRequestHandler } from '@pins/local-plans-lib/util/async-handler.ts';
import type { PortalService } from '#service';
import { BOOLEAN_OPTIONS, expressValidationErrorsToGovUkErrorList } from '@planning-inspectorate/dynamic-forms';
import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { clearSessionData, readSessionData } from '@pins/local-plans-lib/util/session.ts';
import { sendAuthCodeNotification } from '../auth/send-code.ts';

export function buildHasCaseReferenceNumberPage(viewData = {}): AsyncRequestHandler {
	return async (req, res) => {
		return res.render('views/login/has-case-reference.njk', {
			questionText: 'Do you have a case reference number?',
			hintText: 'For example, ref/0000001',
			...viewData
		});
	};
}

export function buildSubmitHasCaseReferenceNumber(service: PortalService): AsyncRequestHandler {
	const { logger } = service;
	return async (req: Request, res: Response) => {
		const { hasCaseReferenceNumber } = req.body;

		if (!hasCaseReferenceNumber) {
			logger.info({ hasCaseReferenceNumber }, 'no value provided for hasCaseReferenceNumber');

			req.body.errors = {
				hasCaseReferenceNumber: { msg: 'Select yes if you have a case reference number' }
			};
			req.body.errorSummary = expressValidationErrorsToGovUkErrorList(req.body.errors);

			await buildHasCaseReferenceNumberPage({
				errors: req.body.errors,
				errorSummary: req.body.errorSummary
			})(req, res);

			return;
		}

		req.session.hasCaseReferenceNumber = hasCaseReferenceNumber;

		if (hasCaseReferenceNumber === BOOLEAN_OPTIONS.NO) {
			return res.redirect(`${req.baseUrl}/no-access`);
		}

		return res.redirect(`${req.baseUrl}/sign-in`);
	};
}

export function buildEnterCredentialsPage(viewData = {}): AsyncRequestHandler {
	return async (req: Request, res: Response) => {
		return res.render('views/login/enter-credentials-page.njk', {
			pageTitle: 'Sign-in',
			emailQuestionText: 'Email address',
			caseNumberQuestionText: 'Case number',
			caseNumberHintText:
				'You can find this in the email inviting you to sign in to this service. For example, ref/0000001',
			backLinkUrl: `${req.baseUrl}/has-case-reference`,
			...viewData
		});
	};
}

export function buildSubmitCredentialsPage(service: PortalService): AsyncRequestHandler {
	const { logger, db } = service;
	return async (req: Request, res: Response) => {
		// check credentials exist
		const { email, caseReference } = req.body;
		if (!email) {
			logger.info(`Email address now provided - ${email}`);
			req.body.errors = {
				email: { msg: 'Enter your email address' }
			};
			buildEnterCredentialsPage();
		}
		if (!caseReference) {
			logger.info(`Case number not provided - ${caseReference}`);
			req.body.errors = {
				caseReference: { msg: 'Enter your case number' }
			};
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
			// upsert OTP record
			const MAX_ATTEMPTS = 3;
			const current_attempts = await db.oneTimePassword.findUnique({
				where: { email_caseReference: { email, caseReference } }
			});
			if (current_attempts === null || current_attempts.attempts < MAX_ATTEMPTS) {
				await db.oneTimePassword.upsert({
					where: { email_caseReference: { email, caseReference } },
					update: { hashedOtp, attempts: { increment: 1 } },
					create: { email, caseReference, hashedOtp, attempts: 0, expiresAt }
				});
			} else if (current_attempts.attempts >= MAX_ATTEMPTS) {
				req.body.errors = {
					email: { msg: 'You have requested too many passwords' },
					caseReference: { msg: 'You have requested too many passwords' }
				};
				await buildEnterCredentialsPage({
					errors: req.body.errors,
					errorSummary: expressValidationErrorsToGovUkErrorList(req.body.errors)
				})(req, res);
				return;
			}

			// go to OTP page
			req.session.email = email;
			req.session.caseReference = caseReference.toUpperCase();

			await sendAuthCodeNotification(service, email, { authCode: otp, expiryMinutes: '30' });

			return res.redirect(`${req.baseUrl}/enter-code`);
		} catch (error) {
			logger.error(error);
			req.body.errors = {
				otpError: { msg: 'There was an error creating the OTP, apologies, please start again' }
			};
			req.body.errorSummary = expressValidationErrorsToGovUkErrorList(req.body.errors);

			return res.render('views/login/enter-credentials-page.njk', {
				pageTitle: 'Sign-in',
				emailQuestionText: 'Email address',
				caseNumberQuestionText: 'Case number',
				caseNumberHintText:
					'You can find this in the email inviting you to sign in to this service. For example, ref/0000001',
				backLinkUrl: `${req.baseUrl}/has-case-reference`,
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
			backLinkUrl: `${req.baseUrl}/sign-in`,
			showNewCodeMessage,
			...viewData
		});
	};
}

export function buildSubmitOtpPage(service: PortalService) {
	return async (req: Request, res: Response) => {
		const { db, logger } = service;

		const email = req.session.email;
		const caseReference = req.session.caseReference;

		if (!email || !caseReference) {
			return res.redirect(`${req.baseUrl}/has-case-reference`);
		}

		const otpRecord = await db.oneTimePassword.findUnique({
			where: { email_caseReference: { email, caseReference } }
		});

		if (!otpRecord) return res.redirect(`${req.baseUrl}/has-case-reference`);

		const { otp } = req.body;

		const otpCodesMatch = await bcrypt.compare(otp.trim().toUpperCase(), otpRecord?.hashedOtp);
		if (!otpCodesMatch) {
			logger.error('codes do not match');
			res.redirect(`${req.baseUrl}/enter-code`);
		} else res.redirect(`/`);
	};
}

export function buildVerifyToken(service: PortalService) {
	return async (req: Request, res: Response) => {
		const { logger, db } = service;
		const token = Array.isArray(req.params.token) ? req.params.token[0] : req.params.token;
		if (!token) {
			logger.error('token not found');
			res.redirect(`/`);
		}
		logger.info(`token = ${token}`);
		const tokenRecord = await db.emailActionToken.findUnique({ where: { token } });
		if (!tokenRecord) throw new Error('token not found');
		else if (tokenRecord.usedAt) throw new Error('token has already been used');
		else {
			await db.emailActionToken.update({
				where: { token },
				data: { usedAt: new Date(Date.now()) }
			});
			logger.info(`token updated: ${tokenRecord}`);

			//generate OTP
			const OTP_LENGTH = 8;
			const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
			const bytes = new Uint8Array(OTP_LENGTH);
			crypto.getRandomValues(bytes);
			const otp = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');
			logger.info(`OTP ${otp}`);

			// send OTP to user
			await sendAuthCodeNotification(service, tokenRecord.userEmail, { authCode: otp, expiryMinutes: '20' });
			res.redirect(`${req.baseUrl}/enter-code`);
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
