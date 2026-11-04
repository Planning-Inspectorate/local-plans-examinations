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
				select: {
					id: true,
					planType: true,
					lpas: { select: { lpaName: true } },
					contacts: {
						select: {
							email: true,
							lpa: { select: { lpaCode: true, lpaName: true } }
						}
					}
				}
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

		// send email to LPA contacts using GOV.UK Notify
		const caseLpas = caseRecord.lpas.map((lpa) => lpa.lpaName).join(', ');
		const planType = caseRecord.planType
			.split('-')
			.map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
			.join(' ');
		const lpaEmails = [...new Set(caseRecord.contacts.map((contact) => contact.email))];
		const notifyReference = `gateway-2-submission:${reference}`;
		const personalisation = {
			['plan_ref']: reference,
			['authority_name']: caseLpas,
			['plan_type']: planType,
			['team_email_address']: govNotify.localPlansTeamEmail,
			['contact_info']: 'If you need to contact us, call 0303 444 5000'
		};

		await Promise.allSettled(
			lpaEmails.map(async (email) => {
				try {
					await notifyClient?.sendEmail(govNotify.templateIds.gw2Submission, email, {
						personalisation,
						reference: notifyReference
					});
					logger.info({ email }, 'gateway 2 submission - LPA email sent');
				} catch (error) {
					logger.error({ error, email }, 'failed to send gateway 2 submission LPA email');
				}
			})
		);
		return res.redirect(`/manage-local-plans/${encodedReference}/gateway-2-submission/application-complete`);
	};
}
