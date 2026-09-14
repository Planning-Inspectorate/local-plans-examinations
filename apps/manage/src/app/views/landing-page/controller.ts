import type { Response, Request } from 'express';
import type { AsyncRequestHandler } from '@planning-inspectorate/core/util';
import type { ManageService } from '#service';
import { resolveCaseHeaderStatus } from '../../classes/status-tag-classes.ts';
import { gateway2SetIds } from '@pins/local-plans-database/src/seed/static-data/ids/document-set.ts';

export function buildLandingPage(service: ManageService): AsyncRequestHandler {
	return async (req: Request, res: Response) => {
		const { db, logger } = service;
		try {
			const cases = await db.case.findMany({
				where: { deletedDate: null },
				select: {
					id: true,
					reference: true,
					planTitle: true,
					planType: true,
					caseOfficer: true,
					deletedDate: true
				}
			});

			const casesWithStatus = await Promise.all(
				cases.map(async (caseRecord) => {
					const [gateway1Info, gateway2Info] = await Promise.all([
						db.gateway1Info.findUnique({
							where: { caseId: caseRecord.id }
						}),
						db.gateway2Info.findUnique({
							where: { caseId: caseRecord.id }
						})
					]);

					const gateway2Documents = await db.document.findMany({
						where: {
							caseId: caseRecord.id,
							documentSetId: { in: gateway2SetIds }
						}
					});

					const status = resolveCaseHeaderStatus(gateway1Info, gateway2Info, gateway2Documents);

					return {
						...caseRecord,
						headerStatusText: status.headerStatusText,
						headerStatusClasses: status.headerStatusClasses
					};
				})
			);
			return res.render('views/landing-page/landing-page.njk', { cases: casesWithStatus });
		} catch (error) {
			logger.error({ error }, 'Unable to fetch cases');
			return res.status(500).render('views/errors/500.njk');
		}
	};
}
