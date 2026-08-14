import type { Response, Request } from 'express';
import type { AsyncRequestHandler } from '@pins/local-plans-lib/util/async-handler.ts';
import type { ManageService } from '#service';
import * as authSession from '../../auth/session.service.ts';

export function buildAssignedToMe(service: ManageService): AsyncRequestHandler {
	return async (req: Request, res: Response) => {
		const { db, logger } = service;
		const account = authSession.getAccount(req.session);

		const caseOfficerText = account?.name;
		const caseOfficer = account?.localAccountId;

		try {
			const unmappedCases = await db.case.findMany({
				where: {
					OR: [
						{ caseOfficer },
						{ assessorGateway3: caseOfficerText },
						{ qaInspector1: caseOfficerText },
						{ qaInspector2: caseOfficerText },
						{ qaInspector3: caseOfficerText },
						{ gateway2Info: { assessorName: caseOfficerText } },
						//{gateway3Info: 							****to be implemented****
						//	{assessorName: caseOfficerText}			****to be implemented****
						//},
						{
							examinationInfo: {
								OR: [
									//{assessorName: caseOfficerText},		****to be implemented****
									{ examiningInspector1: caseOfficerText },
									{ examiningInspector2: caseOfficerText },
									{ examiningInspector3: caseOfficerText }
									//{qaInspector1: caseOfficerText},		****to be implemented****
									//{qaInspector2: caseOfficerText},		****to be implemented****
									//{qaInspector3: caseOfficerText},		****to be implemented****
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
					return {
						...c,
						caseOfficer: caseOfficerName
					};
				})
			);

			return res.render('views/assigned-to-me/assigned-to-me.njk', { cases, caseOfficerText });
		} catch (error) {
			logger.error({ error }, 'Unable to fetch cases');
			return res.status(500).render('views/errors/500.njk');
		}
	};
}
