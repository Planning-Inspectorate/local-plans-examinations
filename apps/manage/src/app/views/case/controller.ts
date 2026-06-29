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
				where: { reference },
				include: {
					lpas: true
				}
			});

			if (!currentCase) {
				return res.status(404).render('views/errors/404.njk');
			}

			// Calculate current stage based on gateway dates
			let currentStage = 'Gateway 2';
			let status = 'In progress';
			let statusColor = 'govuk-tag--blue';

			// Mock logic for stage determination - will be replaced with real business logic
			// Status tag colors: Ready to start (green), In progress (blue), With PINS (yellow), Action required (red), Invalid (grey), Completed (plain)
			if (currentCase.submissionDate) {
				currentStage = 'Examination';
				status = 'Not started';
				statusColor = '';
			} else if (currentCase.gateway3Date) {
				currentStage = 'Gateway 3';
				status = 'Ready to start';
				statusColor = 'govuk-tag--green';
			} else if (currentCase.gateway2Date) {
				currentStage = 'Gateway 2';
				status = 'In progress';
				statusColor = 'govuk-tag--blue';
			} else if (currentCase.gateway1Date) {
				currentStage = 'Gateway 1';
				status = 'Completed';
				statusColor = '';
			}

			// Additional status options for future implementation:
			// With PINS: status = 'With PINS', statusColor = 'govuk-tag--yellow'
			// Action required: status = 'Action required', statusColor = 'govuk-tag--red'
			// Invalid: status = 'Invalid', statusColor = 'govuk-tag--grey'

			// Extract LPA data
			const primaryLpa = currentCase.lpas[0]?.lpaCode || 'Unknown LPA';
			const linkedLpas = currentCase.lpas.slice(1).map((lpa) => lpa.lpaCode);

			return res.render('views/case/case.njk', {
				backLinkUrl: '/your-plans',
				backLinkText: 'Back to my plans',
				pageTitle: currentCase.reference,
				pageHeading: currentCase.planTitle,
				pageCaption: currentCase.reference,
				currentCase,
				currentStage,
				status,
				statusColor,
				primaryLpa,
				linkedLpas
			});
		} catch (error) {
			logger.error(`Unable to fetch case ${reference} ${error}`);
			return res.status(500).render('views/errors/500.njk');
		}
	};
}
