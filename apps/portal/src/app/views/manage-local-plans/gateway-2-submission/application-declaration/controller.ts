import type { Request, RequestHandler, Response } from 'express';
import type { AsyncRequestHandler } from '@pins/local-plans-lib/util/async-handler.ts';
import type { PortalService } from '#service';
import { getRoutePlanReference } from '../utils.ts';
import { loadConfig } from '../../../../config.ts';

const VIEW_PATH = 'views/manage-local-plans/gateway-2-submission/application-declaration/application-declaration.njk';

/**
 * Renders the review declaration page.
 */
export function buildGetDeclarationPage(): AsyncRequestHandler {
	return async (req: Request, res: Response) => {
		const reference = getRoutePlanReference(req) ?? '';
		const encodedReference = encodeURIComponent(reference);

		return res.render(VIEW_PATH, {
			pageTitle: 'Review declaration',
			pageHeading: 'Review declaration',
			pageCaption: 'Your application',
			backLinkUrl: `/manage-local-plans/${encodedReference}/gateway-2-submission`
		});
	};
}

/**
 * Handles the declaration form submission.
 * Validates that both checkboxes are checked, then redirects to the application-complete page.
 */
export function buildPostDeclarationPage(service: PortalService): RequestHandler {
	return async (req: Request, res: Response) => {
		const reference = getRoutePlanReference(req) ?? '';
		const encodedReference = encodeURIComponent(reference);
		const { logger, db, notifyClient } = service;
		const { govNotify } = loadConfig();

		const declarations = req.body.declaration;
		const selected = Array.isArray(declarations) ? declarations : declarations ? [declarations] : [];

		const hasInformationTrue = selected.includes('informationTrue');
		const hasPrivacyNotice = selected.includes('privacyNotice');

		if (!hasInformationTrue || !hasPrivacyNotice) {
			logger.info(`Declaration validation failed for case ${reference}`);

			return res.render(VIEW_PATH, {
				pageTitle: 'Review declaration',
				pageHeading: 'Review declaration',
				pageCaption: 'Your application',
				backLinkUrl: `/manage-local-plans/${encodedReference}/gateway-2-submission`,
				errorSummary: [
					{
						text: 'You must confirm both declarations before you can submit your application.',
						href: '#declaration'
					}
				],
				errors: {
					declaration: {
						text: 'You must confirm both declarations before you can submit your application.'
					}
				},
				formValues: {
					informationTrue: hasInformationTrue,
					privacyNotice: hasPrivacyNotice
				}
			});
		}

		logger.info(`Declaration confirmed for case ${reference}`);
		// get email address for LPA
		let emails;
		try {
			emails = await db.case.findUnique({
				where: { reference },
				select: { contacts: true }
			});
		} catch (error) {
			logger.error({ error }, `Failed to retrieve email address for case ${reference}`);
			return res.status(500).send('Failed to retrieve email address');
		}
		if (!emails) {
			logger.error(`No email address found for case ${reference}`);
			return res.status(500).send('No email address found');
		}
		// send email to LPA using GOV.UK Notify
		await Promise.allSettled(
			emails.contacts.map(async (email) => {
				try {
					await notifyClient?.sendEmail(govNotify.templateIds.gw2Submission, email.email, {
						personalisation: {
							plan_ref: reference,
							lpa_name: 'lpa name',
							plan_type: 'plan type',
							workshop_week_monday: 'workshop week monday',
							team_email_address: 'team email address',
							team_phone: 'team phone'
						}
					});
					logger.info({ email }, 'gateway 2 submission - email sent');
				} catch (error) {
					logger.error({ error, email }, 'failed to send gateway 2 submission email');
				}
			})
		);
		return res.redirect(`/manage-local-plans/${encodedReference}/gateway-2-submission/application-complete`);
	};
}
