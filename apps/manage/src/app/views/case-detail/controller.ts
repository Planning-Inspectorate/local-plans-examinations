import { ManageService } from '#service';
import type { Request, Response, NextFunction } from 'express';
import { booleanToYesNoValue, JourneyResponse, list } from '@planning-inspectorate/dynamic-forms';
import type { SaveParams } from '@planning-inspectorate/dynamic-forms';
import { createJourney, JOURNEY_ID } from '../create-a-case/journey.ts';

export function buildGetJourneyMiddleware(service: ManageService, questions: any) {
	const { db } = service;
	return async (req: Request, res: Response, next: NextFunction) => {
		const id = req.params.id;
		if (!id) {
			throw new Error('id param missing');
		}

		const answers = await db.case.findUnique({
			where: { id }
		});
		if (answers !== null) {
			const { secondaryLPA, anotherContact, ...readyForRendering } = answers;
			const viewData = {
				...readyForRendering,
				secondaryLPA: booleanToYesNoValue(secondaryLPA),
				anotherContact: booleanToYesNoValue(anotherContact)
			};
			res.locals.originalAnswers = { ...viewData };
			res.locals.journeyResponse = new JourneyResponse(JOURNEY_ID, 'ref', viewData);
			res.locals.journey = createJourney(questions, res.locals.journeyResponse, req);
		}

		next();
	};
}

export function buildViewCaseDetails() {
	return async (req: Request, res: Response) => {
		await list(req, res, '', {
			hideStatus: true,
			baseUrl: req.baseUrl
		});
	};
}

export function buildUpdateCase(service: ManageService) {
	const { db } = service;
	return async (params: SaveParams) => {
		const id = params.req.params.id;
		try {
			await db.case.update({
				where: { id },
				data: params.data.answers
			});
		} catch (error) {
			throw new Error(`DB not updated: ${error}`);
		}
	};
}
