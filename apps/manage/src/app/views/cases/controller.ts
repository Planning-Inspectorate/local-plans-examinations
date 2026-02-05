import { ManageService } from '#service';
import type { Request, Response } from 'express';

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
