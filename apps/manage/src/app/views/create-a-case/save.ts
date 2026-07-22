import type { RequestHandler } from 'express';
import type { ManageService } from '#service';
import { clearDataFromSession, type JourneyResponse } from '@planning-inspectorate/dynamic-forms';
import type { JourneyAnswers } from '@planning-inspectorate/dynamic-forms/src/journey/journey-types.d.ts';
import { JOURNEY_ID } from './journey.ts';

/**
 * The structure of data for the journey answers
 * depends on the fieldName for each question
 */
export interface CreateCaseAnswers extends JourneyAnswers {
	email: string;
	reference: string;
	caseOfficer: string;
	planTitle: string;
	planType: string;
	checkLpas: {
		lpa: string;
	}[];
	contactDetails: {
		firstName: string;
		lastName: string;
		email: string;
		phone?: string;
		lpaContact: string;
	}[];
	intentionToCommenceDate?: string;
	gateway1Date?: string;
	gateway2Date?: string;
	gateway3Date?: string;
	submissionDate?: string;
}

/**
 * Returns a function to save the journey answers to the database
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

		const uniqueLpaCodes = [...new Set(answers.checkLpas.map((lpa) => lpa.lpa))];
		await saveDataToDatabase(service, answers, uniqueLpaCodes);

		service.logger.info(answers, 'case created');

		// Send email to LPA using Gov Notify
		if (!service.notifyClient) {
			service.logger.warn('Notify client not configured');
		} else {
			const portalUrl = process.env.PORTAL_URL;
			const templateID = process.env.TEMPLATE_ID;
			if (!portalUrl) throw new Error('PORTAL_URL environment variable is not set');
			if (!templateID) throw new Error('TEMPLATE_ID environment variable is not set');
			const portalLoginURL = `${portalUrl}/login`;
			const caseReference = answers.reference;

			await Promise.allSettled(
				allEmails.map(async (email) => {
					try {
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
				})
			);
		}

		clearDataFromSession({ req, journeyId: JOURNEY_ID });
		res.render('views/layouts/success.njk', { reference: answers.reference });
	};
}

function parseDdMmYyyy(value: string): Date {
	const [day, month, year] = value.split('/').map(Number);
	return new Date(year, month - 1, day);
}

async function saveDataToDatabase(
	service: ManageService,
	answers: CreateCaseAnswers,
	uniqueLpaCodes: string[]
): Promise<void> {
	await service.db.$transaction(async (tx) => {
		await tx.case.create({
			data: {
				reference: answers.reference,
				email: answers.email,
				caseOfficer: answers.caseOfficer,
				planTitle: answers.planTitle,
				planType: answers.planType,
				lpas: {
					connectOrCreate: uniqueLpaCodes.map((lpaCode) => ({
						where: { lpaCode },
						create: { lpaCode }
					}))
				},
				contacts: {
					create: answers.contactDetails.map((contact) => ({
						firstName: contact.firstName,
						lastName: contact.lastName,
						email: contact.email,
						phoneNumber: contact.phone || '',
						lpaCode: contact.lpaContact
					}))
				}
			}
		});

		await Promise.all([
			tx.gateway1Info.create({
				data: {
					caseId: answers.reference,
					...(answers.intentionToCommenceDate && {
						noticeOfIntention: parseDdMmYyyy(answers.intentionToCommenceDate)
					}),
					...(answers.gateway1Date && {
						estimatedGateway1Date: parseDdMmYyyy(answers.gateway1Date)
					})
				}
			}),
			tx.gateway2Info.create({
				data: {
					caseId: answers.reference,
					...(answers.gateway2Date && {
						estimatedDate: parseDdMmYyyy(answers.gateway2Date)
					})
				}
			}),
			tx.gateway3Info.create({
				data: {
					caseId: answers.reference,
					...(answers.gateway3Date && {
						estimatedDate: parseDdMmYyyy(answers.gateway3Date)
					})
				}
			}),
			tx.examinationInfo.create({
				data: {
					caseId: answers.reference,
					...(answers.submissionDate && {
						submissionForExaminationDate: parseDdMmYyyy(answers.submissionDate)
					})
				}
			})
		]);
	});
}
