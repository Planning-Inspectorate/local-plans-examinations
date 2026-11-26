import type { Response, Request } from 'express';
import type { AsyncRequestHandler } from '@planning-inspectorate/core/util';
import type { ManageService } from '#service';
import * as authSession from '@planning-inspectorate/core/auth';
import { resolveCaseHeaderStatus } from '../../classes/status-tag-classes.ts';
import { gateway2SetIds, gateway3SetIds } from '@pins/local-plans-database/src/seed/static-data/ids/document-set.ts';
import { getExaminationStages } from '#util/util.ts';
import { getPaginationDetails, getPaginationModel } from '@pins/local-plans-lib/util/pagination.ts';

export const CASES_PER_PAGE = 30;

export function buildAssignedToMe(service: ManageService): AsyncRequestHandler {
	return async (req: Request, res: Response) => {
		const { db, logger } = service;
		const account = service.authDisabled ? undefined : authSession.getAccount(req.session);

		const caseOfficerText = account?.name;
		const caseOfficer = account?.localAccountId;
		const assignedToCurrentUser = caseOfficer
			? {
					OR: [
						{ caseOfficer },
						{ assessorGateway3: caseOfficer },
						{ gateway2Info: { assessorName: caseOfficer } },
						{ gateway2Info: { additionalAssessors: { some: { assessorName: caseOfficer } } } },
						{
							examinationInfo: {
								OR: [
									{ examiningInspector1: caseOfficer },
									{ examiningInspector2: caseOfficer },
									{ examiningInspector3: caseOfficer }
								]
							}
						}
					]
				}
			: {};

		try {
			const where = {
				deletedDate: null,
				...assignedToCurrentUser
			};
			const totalCases = await db.case.count({ where });
			const { currentPage, totalPages, skip, take } = getPaginationDetails(totalCases, req.query.page, CASES_PER_PAGE);
			const unmappedCases = await db.case.findMany({
				where,
				orderBy: { createdAt: 'desc' },
				skip,
				take
			});

			const cases = await Promise.all(
				unmappedCases.map(async (c) => {
					const [gateway1Info, gateway2Info, gateway3Info] = await Promise.all([
						db.gateway1Info.findUnique({
							where: { caseId: c.id }
						}),
						db.gateway2Info.findUnique({
							where: { caseId: c.id },
							include: {
								workshops: true
							}
						}),
						db.gateway3Info.findUnique({
							where: { caseId: c.id },
							include: { submissions: true }
						})
					]);

					const gateway2Documents = await db.document.findMany({
						where: {
							caseId: c.id,
							documentSetId: { in: gateway2SetIds },
							isDeleted: false,
							isTemp: false
						}
					});
					const gateway3Documents = await db.document.findMany({
						where: {
							caseId: c.id,
							documentSetId: { in: gateway3SetIds },
							isDeleted: false,
							isTemp: false
						}
					});

					const examinationStatus = await getExaminationStages(service, c.id);

					const status = resolveCaseHeaderStatus(
						gateway2Documents,
						gateway3Documents,
						gateway1Info,
						gateway2Info,
						gateway3Info?.submissions ?? [],
						examinationStatus
					);

					return {
						...c,
						headerStatusText: status.headerStatusText,
						headerStatusClasses: status.headerStatusClasses
					};
				})
			);

			return res.render('views/assigned-to-me/assigned-to-me.njk', {
				backLinkUrl: '/',
				cases,
				caseOfficerText,
				totalCases,
				pagination: getPaginationModel(req, totalPages, currentPage)
			});
		} catch (error) {
			logger.error({ error }, 'Unable to fetch cases');
			return res.status(500).render('views/errors/500.njk');
		}
	};
}
