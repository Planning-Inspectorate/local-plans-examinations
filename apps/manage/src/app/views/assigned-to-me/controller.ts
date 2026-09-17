import type { Response, Request } from 'express';
import type { AsyncRequestHandler } from '@planning-inspectorate/core/util';
import type { ManageService } from '#service';
import * as authSession from '@planning-inspectorate/core/auth';
import { resolveCaseHeaderStatus } from '../../classes/status-tag-classes.ts';
import { gateway2SetIds } from '@pins/local-plans-database/src/seed/static-data/ids/document-set.ts';

export function buildAssignedToMe(service: ManageService): AsyncRequestHandler {
	return async (req: Request, res: Response) => {
		const { db, logger } = service;
		const account = authSession.getAccount(req.session);

		const caseOfficerText = account?.name;
		const caseOfficer = account?.localAccountId;

		try {
			const unmappedCases = await db.case.findMany({
				where: {
					deletedDate: null,
					OR: [
						{ caseOfficer },
						{ assessorGateway3: caseOfficer },
						//{ qaInspector1: caseOfficer },
						//{ qaInspector2: caseOfficer },
						//{ qaInspector3: caseOfficerText },
						{ gateway2Info: { assessorName: caseOfficer } },
						//{gateway3Info: 							****to be implemented****
						//	{assessorName: caseOfficer}			****to be implemented****
						//},
						{
							examinationInfo: {
								OR: [
									//{assessorName: caseOfficer},		****to be implemented****
									{ examiningInspector1: caseOfficer },
									{ examiningInspector2: caseOfficer },
									{ examiningInspector3: caseOfficer }
									//{ qaInspector1: caseOfficer },
									//{ qaInspector2: caseOfficer },
									//{ qaInspector3: caseOfficer }
								]
							}
						}
					]
				}
			});

			const entraClient = service.getEntraClient(req.session as authSession.SessionWithAuth);

			if (!entraClient) {
				return res.status(500).render('views/errors/500.njk');
			}

			const cases = await Promise.all(
				unmappedCases.map(async (c) => {
					const caseOfficerName = await entraClient.getUserDisplayName(c.caseOfficer);

					const [gateway1Info, gateway2Info] = await Promise.all([
						db.gateway1Info.findUnique({
							where: { caseId: c.id }
						}),
						db.gateway2Info.findUnique({
							where: { caseId: c.id }
						})
					]);

					const gateway2Documents = await db.document.findMany({
						where: {
							caseId: c.id,
							documentSetId: { in: gateway2SetIds }
						}
					});

					const status = resolveCaseHeaderStatus(gateway2Documents, gateway1Info, gateway2Info);

					return {
						...c,
						caseOfficer: caseOfficerName,
						headerStatusText: status.headerStatusText,
						headerStatusClasses: status.headerStatusClasses
					};
				})
			);

			return res.render('views/assigned-to-me/assigned-to-me.njk', { backLinkUrl: '/', cases, caseOfficerText });
		} catch (error) {
			logger.error({ error }, 'Unable to fetch cases');
			return res.status(500).render('views/errors/500.njk');
		}
	};
}
