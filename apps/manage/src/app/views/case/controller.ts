import type { AsyncRequestHandler } from '@pins/local-plans-lib/util/async-handler.ts';
import type { ManageService } from '#service';
import { JourneyResponse } from '@planning-inspectorate/dynamic-forms';
import { JOURNEY_ID } from './journey.ts';

export function updateCaseField(service: ManageService) {
	return async ({ req, res }) => {
		const { db, logger } = service;
		const { reference } = req.params;

		const journeyResponse = res.locals?.journeyResponse?.answers || {};
		console.log('REQUAY', req.body);
		console.log('I AM THE ONE AND ONLY', journeyResponse);
		logger.info(`Updating case ${reference} with ${JSON.stringify(journeyResponse)}`);

		await db.case.update({
			where: { reference },
			data: {
				...req.body
			}
		});
	};
}

// export function buildCasePage(service: ManageService): AsyncRequestHandler {
// 	return async (req: Request, res: Response) => {
// 		const { db, logger } = service;
// 		const rawReferenceString = Array.isArray(req.params.reference) ? req.params.reference[0] : req.params.reference;
//
// 		if (!rawReferenceString) {
// 			return res.status(404).render('views/errors/404.njk');
// 		}
//
// 		let reference: string;
// 		try {
// 			reference = decodeURIComponent(rawReferenceString);
// 		} catch {
// 			return res.status(404).render('views/errors/404.njk');
// 		}
//
// 		try {
// 			const currentCase = await db.case.findUnique({
// 				where: { reference },
// 				include: { lpas: true, contacts: true }
// 			});
//
// 			if (!currentCase) {
// 				return res.status(404).render('views/errors/404.njk');
// 			}
//
// 			rows[0].value.text = currentCase.planTitle || '-';
// 			rows[1].value.text = currentCase.planType || '-';
// 			rows[3].value.text = currentCase.lpas.map((lpa) => lpa.lpaCode).join(', ') || '-';
// 			rows[4].value.text = currentCase.caseOfficer || '-';
//
// 			return res.render('views/case/case.njk', {
// 				backLinkUrl: '/',
// 				backLinkText: 'Back to all cases',
// 				pageTitle: currentCase.reference,
// 				pageHeading: currentCase.planTitle,
// 				pageCaption: currentCase.reference,
// 				rows
// 			});
// 		} catch (error) {
// 			logger.error(`Unable to fetch case ${reference} ${error}`);
// 			return res.status(500).render('views/errors/500.njk');
// 		}
// 	};
// }

export function buildGetJourneyMiddleware(service: ManageService): AsyncRequestHandler {
	return async (req, res, next) => {
		const { db, logger } = service;

		const rawReferenceString = Array.isArray(req.params.reference) ? req.params.reference[0] : req.params.reference;
		let reference: string;
		try {
			reference = decodeURIComponent(rawReferenceString);
		} catch {
			return res.status(404).render('views/errors/404.njk');
		}
		try {
			const currentCase = await db.case.findUnique({
				where: { reference },
				include: { lpas: true, contacts: true }
			});

			if (!currentCase) {
				return res.status(404).render('views/errors/404.njk');
			}

			res.locals.journeyResponse = new JourneyResponse(JOURNEY_ID, '', currentCase);
		} catch (error) {
			logger.error(`Unable to fetch case ${reference} ${error}`);
		}
		//TODO
		next();
	};
}

interface CaseDetails {
	planTitle: string;
	planType: string;
}

export async function getCaseData(reference: string, service: ManageService): Promise<CaseDetails> {
	const currentCase = await service.db.case.findUnique({
		where: { reference },
		include: { lpas: true, contacts: true }
	});

	return {
		planTitle: currentCase?.planTitle || '',
		planType: currentCase?.planType || ''
	};
}
