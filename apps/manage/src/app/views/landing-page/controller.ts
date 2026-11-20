import type { Response, Request } from 'express';
import type { AsyncRequestHandler } from '@planning-inspectorate/core/util';
import type { ManageService } from '#service';
import { resolveCaseHeaderStatus } from '../../classes/status-tag-classes.ts';
import { gateway2SetIds, gateway3SetIds } from '@pins/local-plans-database/src/seed/static-data/ids/document-set.ts';
import { getExaminationStages } from '#util/util.ts';
import { getPaginationDetails, getPaginationModel } from '@pins/local-plans-lib/util/pagination.ts';

export const CASES_PER_PAGE = 30;

export function buildLandingPage(service: ManageService): AsyncRequestHandler {
	return async (req: Request, res: Response) => {
		const { db, logger } = service;
		try {
			const where = { deletedDate: null };
			const totalCases = await db.case.count({ where });
			const { currentPage, totalPages, skip, take } = getPaginationDetails(totalCases, req.query.page, CASES_PER_PAGE);
			const cases = await db.case.findMany({
				where,
				orderBy: { createdAt: 'desc' },
				skip,
				take
			});

			const casesWithStatus = await Promise.all(
				cases.map(async (caseRecord) => {
					const [gateway1Info, gateway2Info, gateway3Info] = await Promise.all([
						db.gateway1Info.findUnique({
							where: { caseId: caseRecord.id }
						}),
						db.gateway2Info.findUnique({
							where: { caseId: caseRecord.id },
							include: {
								workshops: true
							}
						}),
						db.gateway3Info.findUnique({
							where: { caseId: caseRecord.id },
							include: { submissions: true }
						})
					]);

					const gateway2Documents = await db.document.findMany({
						where: {
							caseId: caseRecord.id,
							documentSetId: { in: gateway2SetIds },
							isDeleted: false,
							isTemp: false
						}
					});
					const gateway3Documents = await db.document.findMany({
						where: {
							caseId: caseRecord.id,
							documentSetId: { in: gateway3SetIds },
							isDeleted: false,
							isTemp: false
						}
					});

					const examinationStatus = await getExaminationStages(service, caseRecord.id);

					const status = resolveCaseHeaderStatus(
						gateway2Documents,
						gateway3Documents,
						gateway1Info,
						gateway2Info,
						gateway3Info?.submissions ?? [],
						examinationStatus
					);

					return {
						...caseRecord,
						headerStatusText: status.headerStatusText,
						headerStatusClasses: status.headerStatusClasses
					};
				})
			);
			return res.render('views/landing-page/landing-page.njk', {
				cases: casesWithStatus,
				totalCases,
				pagination: getPaginationModel(req, totalPages, currentPage)
			});
		} catch (error) {
			logger.error({ error }, 'Unable to fetch cases');
			return res.status(500).render('views/errors/500.njk');
		}
	};
}
