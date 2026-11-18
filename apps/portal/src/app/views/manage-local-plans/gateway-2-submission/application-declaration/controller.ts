import type { Request, RequestHandler, Response } from 'express';
import type { AsyncRequestHandler } from '@planning-inspectorate/core/util';
import type { PortalService } from '#service';
import { getRoutePlanReference, getWorkshopWeekMonday } from '../utils.ts';
import { loadConfig } from '../../../../config.ts';
import { DocumentUtil } from '@pins/local-plans-lib/util/documents.ts';
import { gateway2FileUploadQuestionConfigs } from '../controller.ts';

const VIEW_PATH = 'views/manage-local-plans/gateway-2-submission/application-declaration/application-declaration.njk';

/**
 * Renders the review declaration page.
 */
export function buildGetDeclarationPage(): AsyncRequestHandler {
	return async (req: Request, res: Response) => {
		const reference = getRoutePlanReference(req) ?? '';
		const encodedReference = encodeURIComponent(reference);
		const submissionUrl = `/manage-local-plans/${encodedReference}/gateway-2-submission`;

		return res.render(VIEW_PATH, {
			pageTitle: "Are you sure you're ready to submit?",
			pageHeading: "Are you sure you're ready to submit?",
			backLinkUrl: submissionUrl,
			goBackUrl: submissionUrl
		});
	};
}

/**
 * Handles the declaration form submission.
 * Records the submission and redirects to the confirmation page.
 */
export function buildPostDeclarationPage(service: PortalService): RequestHandler {
	return async (req: Request, res: Response) => {
		const reference = getRoutePlanReference(req) ?? '';
		const encodedReference = encodeURIComponent(reference);
		const { logger, db, notifyClient } = service;
		const { govNotify } = loadConfig();

		logger.info(`Declaration confirmed for case ${reference}`);

		// get case details for submission update and email
		let caseRecord;
		try {
			caseRecord = await db.case.findUnique({
				where: { reference },
				select: {
					id: true,
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

		// Record the submission date on the case and gateway2Info, and release the LPA's documents to manage
		const submissionDate = new Date();
		try {
			const documentSetIds = await DocumentUtil.getDocumentSetIdsByFolderName(
				service,
				gateway2FileUploadQuestionConfigs.map((questionConfig) => questionConfig.url)
			);
			await db.$transaction([
				db.case.update({
					where: { reference },
					data: { submissionDate }
				}),
				db.gateway2Info.update({
					where: { caseId: caseRecord.id },
					data: { actualDate: submissionDate }
				}),
				DocumentUtil.commitTempDocuments(service, caseRecord.id, [...documentSetIds.values()])
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
							['authority_name']: contact.lpa.lpaName || contact.lpa.lpaCode,
							['contact_info']: govNotify.localPlansTeamEmail,
							planType: 'plan type',
							workshopWeekMonday: getWorkshopWeekMonday(submissionDate),
							teamEmailAddress: 'team email address',
							teamPhone: 'team phone'
						},
						reference: `gateway-2-submission:${reference}`
					});
					logger.info({ encodedReference }, 'gateway 2 submission - email sent');
				} catch (error) {
					logger.error({ error, encodedReference }, 'failed to send gateway 2 submission email');
				}
			})
		);
		return res.redirect(`/manage-local-plans/${encodedReference}/gateway-2/confirmation`);
	};
}
