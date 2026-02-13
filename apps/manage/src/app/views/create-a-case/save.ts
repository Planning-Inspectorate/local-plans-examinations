import { clearDataFromSession } from '@planning-inspectorate/dynamic-forms';
import { JOURNEY_ID } from './journey.ts';
import { ManageService } from '#service';
import type { Request, Response } from 'express';

export function buildSaveController(service: ManageService) {
	const { db } = service;
	return async (req: Request, res: Response) => {
		const answers: any = res.locals.journeyResponse.answers;

		if (!res.locals || !res.locals.journeyResponse) {
			throw new Error('journey response required');
		}

		try {
			await db.case.create({
				data: {
					caseOfficer: answers.caseOfficer,
					planTitle: answers.planTitle,
					typeOfApplication: answers.typeOfApplication,
					lpaName: answers.lpaName,
					leadContactFirstName: answers.leadContactFirstName,
					leadContactLastName: answers.leadContactLastName,
					leadContactEmail: answers.leadContactEmail,
					leadContactPhone: answers.leadContactPhone,
					secondaryLPA: answers.secondaryLPA === 'yes',
					anotherContact: answers.anotherContact === 'yes'
				}
			});
		} catch (error) {
			throw new Error(`Error creating case ${error}`);
		}

		clearDataFromSession({
			req,
			journeyId: JOURNEY_ID
		});
		console.log('successfully saved');
		res.redirect(`${req.baseUrl}/success`);
	};
}
