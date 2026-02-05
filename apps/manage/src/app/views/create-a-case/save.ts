import { clearDataFromSession, JourneyResponse } from '@planning-inspectorate/dynamic-forms';
import { JOURNEY_ID } from './journey.ts';
import { ManageService } from '#service';
import type { Request, Response } from 'express';

export function buildSaveController(service: ManageService) {
	const { db, logger } = service;
	return async (req: Request, res: Response) => {
		const journeyResponse: JourneyResponse = res.locals.journeyResponse;
		console.log('journeyResponse', journeyResponse);
		const answers: any = res.locals.journeyResponse.answers;

		if (!res.locals || !res.locals.journeyResponse) {
			throw new Error('journey response required');
		}
		// const answers = journeyResponse.answers;
		// create a new case in a transaction to ensure reference generation is safe
		await db.$transaction(async ($tx): Promise<void> => {
			const data = {
				caseOfficer: answers.caseOfficer,
				planTitle: answers.planTitle,
				typeOfApplication: answers.typeOfApplication,
				lpaName: answers.lpaName,
				leadContactFirstName: answers.leadContactFirstName,
				leadContactLastName: answers.leadContactLastName,
				leadContactEmail: answers.leadContactEmail,
				leadContactPhone: answers.leadContactPhone,
				secondaryLPA: answers.secondaryLPA,
				anotherContact: answers.anotherContact
			};
			logger.info('creating new case');
			await $tx.case.create({ data });
		});

		clearDataFromSession({
			req,
			journeyId: JOURNEY_ID
		});
		console.log('successfully saved');
		res.redirect(`${req.baseUrl}/success`);
	};
}
