import type { RequestHandler } from 'express';
import type { ManageService } from '#service';
import type { JourneyResponse } from '@planning-inspectorate/dynamic-forms';
import type { CaseCreateInput } from '@pins/local-plans-database/src/client/models/Case.ts';
import crypto from 'crypto';

/**
 * The structure of data for the journey answers
 * depends on the fieldName for each question
 */
export interface CreateCaseAnswers {
	email: string;
	name: string;
	reference: string;
}

/**
 * Returns a controller/handler to save the journey answers to the database
 * @param service
 */
export function buildSaveController(service: ManageService): RequestHandler {
	return async (req, res) => {
		if (!res.locals || !res.locals.journeyResponse) {
			throw new Error('journey response required');
		}
		const journeyResponse = res.locals.journeyResponse as JourneyResponse;
		const answers = journeyResponse.answers as CreateCaseAnswers;
		if (typeof answers !== 'object') {
			throw new Error('answers should be an object');
		}

		await service.db.case.create({
			data: mapToDatabase(answers)
		});
		service.logger.info(answers, 'case created');

		// Send email to LPA using Gov Notify
		if (!service.notifyClient) {
			service.logger.warn('Notify client not configured');
		} else {
			try {
				const token = crypto.randomBytes(32).toString('hex');
				const portalUrl = process.env.PORTAL_URL;
				const templateID = process.env.TEMPLATE_ID;
				if (!portalUrl) throw new Error('PORTAL_URL environment variable is not set');
				if (!templateID) throw new Error('TEMPLATE_ID environment variable is not set');
				const magicLink = `${portalUrl}/login/verify/${token}`;
				await service.notifyClient.sendEmail(templateID, answers.email.trim(), {
					personalisation: {
						magic_link: magicLink
					}
				});
				service.logger.info({ email: answers.email }, 'Notification email sent');
				await service.db.emailActionToken.create({
					data: {
						token,
						userEmail: answers.email,
						expiresAt: new Date(Date.now() + 20 * 60 * 1000)
					}
				});
			} catch (error) {
				service.logger.error({ error, email: answers.email }, 'Failed to send notification email');
			}
		}
		res.render('views/layouts/success.njk', { reference: answers.reference });
	};
}

export function mapToDatabase(answers: CreateCaseAnswers): CaseCreateInput {
	return {
		reference: answers.reference,
		email: answers.email,
		name: answers.name
	};
}
