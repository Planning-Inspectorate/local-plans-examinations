import type { Request, Response } from 'express';
import type { AsyncRequestHandler } from '@pins/local-plans-lib/util/async-handler.ts';
import type { ManageService } from '#service';

export function buildCasePage(service: ManageService): AsyncRequestHandler {
	return async (req: Request, res: Response) => {
		const { db, logger } = service;
		const rawReferenceString = Array.isArray(req.params.reference) ? req.params.reference[0] : req.params.reference;

		if (!rawReferenceString) {
			return res.status(404).render('views/errors/404.njk');
		}

		let reference: string;
		try {
			reference = decodeURIComponent(rawReferenceString);
		} catch {
			return res.status(404).render('views/errors/404.njk');
		}

		try {
			const currentCase = await db.case.findUnique({
				where: { reference }
			});

			if (!currentCase) {
				return res.status(404).render('views/errors/404.njk');
			}

			return res.render('views/case/case.njk', {
				backLinkUrl: '/',
				backLinkText: 'Back to all cases',
				pageTitle: currentCase.reference,
				pageHeading: currentCase.planTitle,
				pageCaption: currentCase.reference
			});
		} catch (error) {
			logger.error(`Unable to fetch case ${reference} ${error}`);
			return res.status(500).render('views/errors/500.njk');
		}
	};
}
