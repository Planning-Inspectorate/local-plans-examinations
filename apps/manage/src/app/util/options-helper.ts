import { type NextFunction, type Response, type Request } from 'express';
import * as authSession from '../../../src/app/auth/session.service.ts';
import { asyncHandler } from '@pins/local-plans-lib/util/async-handler.ts';
import { ManageService } from '#service';

export function buildCaseOfficerOptions(service: ManageService, questions: Record<string, any>) {
	return asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
		const entraClient = service.getEntraClient(req.session as authSession.SessionWithAuth);

		if (service.authDisabled) {
			next();
			return;
		}

		const caseOfficers = entraClient ? await entraClient.listAllGroupMembers(service.entraGroupIds.caseOfficers) : [];

		questions.caseOfficer.options = [
			{ value: '', text: '' },
			...caseOfficers.map((m) => ({ value: m.id, text: m.displayName }))
		];
		next();
	});
}
