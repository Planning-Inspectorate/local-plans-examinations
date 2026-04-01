import type { AsyncRequestHandler } from '@pins/local-plans-lib/util/async-handler.ts';
import type { PortalService } from '#service';
import { BOOLEAN_OPTIONS, expressValidationErrorsToGovUkErrorList } from '@planning-inspectorate/dynamic-forms';
import type { Request, Response } from 'express';

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

export function buildNoAccessPage(): AsyncRequestHandler {
	return async (req, res) => {
		return res.render('views/login/no-access.njk', {
			pageTitle: 'You do not have access to this service'
		});
	};
}
