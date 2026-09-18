import type { Request, RequestHandler, Response } from 'express';
import type { AsyncRequestHandler } from '@planning-inspectorate/core/util';
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

		// get case details for submission update and email
		let caseRecord;
		try {
			caseRecord = await db.case.findUnique({
				where: { reference },
				select: { id: true, contacts: true }
			});
		} catch (error) {
			logger.error({ error }, `Failed to retrieve case ${reference}`);
			return res.status(500).send('Failed to retrieve case');
		}
		if (!caseRecord) {
			logger.error(`No case found for reference ${reference}`);
			return res.status(500).send('No case found');
		}

		// Record the submission date on the case and gateway2Info
		const submissionDate = new Date();
		try {
			await db.$transaction([
				db.case.update({
					where: { reference },
					data: { submissionDate }
				}),
				db.gateway2Info.update({
					where: { caseId: caseRecord.id },
					data: { actualDate: submissionDate }
				})
			]);
		} catch (error) {
			logger.error({ error }, `Failed to update submission date for case ${reference}`);
			return res.status(500).send('Failed to record submission');
		}

		// send email to LPA using GOV.UK Notify
		await Promise.allSettled(
			caseRecord.contacts.map(async (contact) => {
				try {
					await notifyClient?.sendEmail(govNotify.templateIds.gw2Submission, contact.email, {
						personalisation: {
							planRef: reference,
							lpaName: 'lpa name',
							planType: 'plan type',
							workshopWeekMonday: 'workshop week monday',
							teamEmailAddress: 'team email address',
							teamPhone: 'team phone'
						}
					});
					logger.info({ encodedReference }, 'gateway 2 submission - email sent');
				} catch (error) {
					logger.error({ error, encodedReference }, 'failed to send gateway 2 submission email');
				}
			})
		);
		return res.redirect(`/manage-local-plans/${encodedReference}/gateway-2-submission/application-complete`);
	};
}
