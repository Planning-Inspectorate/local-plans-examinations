import { ManageService } from '#service';
import type { Request, Response } from 'express';
import { getQuestions } from '../create-a-case/questions.ts';
import { JourneyResponse, list } from '@planning-inspectorate/dynamic-forms';
//TODO check with Ben, is it worth updating DF so that SaveParams and SaveDataFn can be imported as values
import type { SaveParams } from '@planning-inspectorate/dynamic-forms';
import { createJourney, JOURNEY_ID } from '../create-a-case/journey.ts';

export function buildGetJourneyMiddleware(service: ManageService) {
	const { db } = service;
	return async (req: Request, res: Response, next) => {
		const id = req.params.id;

		const questions = getQuestions();
		const answers = await db.case.findUnique({
			where: { id }
		});
		res.locals.originalAnswers = { ...answers };
		res.locals.journeyResponse = new JourneyResponse(JOURNEY_ID, 'ref', answers);
		res.locals.journey = createJourney(questions, res.locals.journeyResponse, req);

		if (!id) {
			throw new Error('id param missing');
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
		const questionName = params.req.params.question;
		const questions = getQuestions();

		const question = Object.values(questions).find((q) => q.url === questionName);
		if (!question) {
			throw new Error('Question not found');
		}
		const dbColumnName = question.fieldName;
		const value = params.req.body[dbColumnName];

		if (typeof dbColumnName === 'undefined' || typeof value === 'undefined') {
			throw new Error('DB column or value not found');
		}

		await db.case.update({
			where: { id },
			data: { [dbColumnName]: value }
		});
	};
}
