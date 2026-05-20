import type { RequestHandler } from 'express';
import type { ManageService } from '#service';
import { clearDataFromSession, type JourneyResponse } from '@planning-inspectorate/dynamic-forms';
import type { CaseCreateInput } from '@pins/local-plans-database/src/client/models/Case.ts';
import { JOURNEY_ID } from './journey.ts';

/**
 * The structure of data for the journey answers
 * depends on the fieldName for each question
 */
export interface CreateCaseAnswers {
	email: string;
	reference: string;
	caseOfficer: string;
	planTitle: string;
	planType: string;
	lpa: string[];
	contactDetails: Array<{
		firstName: string;
		lastName: string;
		email: string;
		phoneNumber?: string;
	}>;
	keyStageDates?: Array<{
		intentionToCommence?: Date;
		gateway1Date?: Date;
		gateway2Date?: Date;
		gateway3Date?: Date;
		submissionForExamDate?: Date;
	}>;
}

/**
 * Returns a controller/handler to save the journey answers to the database
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

		answers.reference = `PLAN/${Math.floor(Math.random() * 1000000)}`;
		answers.email = answers.contactDetails.at(0)!.email;

		const allEmails = answers.contactDetails.map((contact) => contact.email);

		await service.db.case.create({
			data: mapToDatabase(answers)
		});
		service.logger.info(answers, 'case created');

		// Send email to LPA using Gov Notify
		if (!service.notifyClient) {
			service.logger.warn('Notify client not configured');
		} else {
			allEmails.forEach(async (email) => {
				try {
					const portalUrl = process.env.PORTAL_URL;
					const templateID = process.env.TEMPLATE_ID;
					if (!portalUrl) throw new Error('PORTAL_URL environment variable is not set');
					if (!templateID) throw new Error('TEMPLATE_ID environment variable is not set');
					const portalLoginURL = `${portalUrl}/login`;
					const caseReference = answers.reference;

					await service.notifyClient?.sendEmail(templateID, email.trim(), {
						personalisation: {
							portalLoginURL,
							caseReference
						}
					});
					service.logger.info({ email: email }, 'create a case - email sent');
				} catch (error) {
					service.logger.error({ error, email: email }, 'Failed to send create a case email');
				}
			});
		}

		clearDataFromSession({ req, journeyId: JOURNEY_ID });
		res.render('views/layouts/success.njk', { reference: answers.reference });
	};
}

export function mapToDatabase(answers: CreateCaseAnswers): CaseCreateInput {
	return {
		reference: answers.reference,
		email: answers.email,
		caseOfficer: answers.caseOfficer,
		planTitle: answers.planTitle,
		planType: answers.planType,
		lpa: JSON.stringify(answers.lpa || []),
		contactDetails: JSON.stringify(answers.contactDetails || []),
		keyStageDates: JSON.stringify(answers.keyStageDates || [])
	};
}
