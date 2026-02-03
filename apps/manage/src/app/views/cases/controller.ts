import { ManageService } from '#service';
import type { Request, Response } from 'express';
// import { getQuestions } from '../create-a-case/questions.ts';
// import { createJourney, JOURNEY_ID } from '../create-a-case/journey.ts';
// import { JourneyResponse, list } from '@planning-inspectorate/dynamic-forms';

export function listCasesController(service: ManageService) {
	const { db } = service;
	return async (req: Request, res: Response) => {
		let cases;
		await db.$transaction(async ($tx): Promise<void> => {
			cases = await $tx.case.findMany({
				select: {
					planTitle: true,
					caseOfficer: true,
					lpaName: true,
					id: true
				}
			});
		});
		res.render('views/cases/cases.njk', { cases });
	};
}

// export function detailViewCaseController(service: ManageService) {
// 	const { db } = service;
// 	return async (req: Request, res: Response) => {
// 		const { id } = req.params;
// 		let caseDetail;
// 		await db.$transaction(async ($tx): Promise<void> => {
// 			caseDetail = await $tx.case.findUnique({
// 				where: { id }
// 			});
// 		});
// 		res.render('views/cases/case-detail.njk', { caseDetail });
// 	}
// }
//
// export function buildGetJourneyMiddleware(service: ManageService) {
// 	const { db } = service;
// 	return async (req: Request, res: Response, next) => {
// 		const id = req.params.id;
//
// 		const questions = getQuestions();
// 		const answers = await db.case.findUnique({
// 			where: { id },
// 		})
// 		res.locals.originalAnswers = { ...answers };
// 		res.locals.journeyResponse = new JourneyResponse(JOURNEY_ID, 'ref', answers);
// 		res.locals.journey = createJourney(questions, res.locals.journeyResponse, req);
//
// 		if (!id) {
// 			throw new Error('id param missing');
// 		}
// 		next();
// 	}
// }
//
// export function buildViewCaseDetails() {
// 	return async (req: Request, res: Response) => {
// 		const id  = req.params.id;
// 		await list(req, res, '', {
// 			hideStatus: true,
// 			baseUrl: req.baseUrl + `/${id}`,
// 		})
// 	}
// }
