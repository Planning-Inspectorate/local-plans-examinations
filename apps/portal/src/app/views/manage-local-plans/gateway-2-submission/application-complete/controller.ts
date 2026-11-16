import type { Request, Response } from 'express';
import type { AsyncRequestHandler } from '@planning-inspectorate/core/util';
import type { PortalService } from '#service';
import { getRoutePlanReference, getWorkshopWeekMonday } from '../utils.ts';

const VIEW_PATH = 'views/manage-local-plans/gateway-2-submission/application-complete/index.njk';

/**
 * Renders the Gateway 2 submission complete page.
 */
export function buildGetApplicationCompletePage(service: PortalService): AsyncRequestHandler {
	return async (req: Request, res: Response) => {
		const reference = getRoutePlanReference(req) ?? '';
		const encodedReference = encodeURIComponent(reference);

		let caseRecord;
		try {
			caseRecord = await service.db.case.findUnique({
				where: { reference },
				select: {
					gateway2Info: {
						select: {
							actualDate: true
						}
					}
				}
			});
		} catch (error) {
			service.logger.error({ error, reference }, 'Failed to retrieve Gateway 2 submission date');
			res.status(500).send('Failed to retrieve Gateway 2 submission date');
			return;
		}

		if (!caseRecord) {
			res.status(404).render('views/layouts/error', {
				pageTitle: 'Page not found',
				messages: [
					'If you typed the web address, check it is correct.',
					'If you pasted the web address, check you copied the entire web address.'
				]
			});
			return;
		}

		return res.render(VIEW_PATH, {
			pageTitle: 'Gateway 2 submission complete',
			returnToPlanUrl: `/manage-local-plans/${encodedReference}`,
			workshopWeekMonday: getWorkshopWeekMonday(caseRecord.gateway2Info?.actualDate)
		});
	};
}
