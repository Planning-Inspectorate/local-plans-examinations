import { type NextFunction, type Response, type Request } from 'express';
import type * as authSession from '../../../src/app/auth/session.service.ts';
import { asyncHandler } from '@pins/local-plans-lib/util/async-handler.ts';
import type { ManageService } from '#service';

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

export function buildInspectorOptions(service: ManageService, questions: Record<string, any>) {
	return asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
		const entraClient = service.getEntraClient(req.session as authSession.SessionWithAuth);

		if (service.authDisabled) {
			next();
			return;
		}

		const inspectors = entraClient ? await entraClient.listAllGroupMembers(service.entraGroupIds.inspectors) : [];

		const options_map = [{ value: '', text: '' }, ...inspectors.map((m) => ({ value: m.id, text: m.displayName }))];
		questions.examiningInspector1.options = options_map;
		questions.examiningInspector2.options = options_map;
		questions.examiningInspector3.options = options_map;
		next();
	});
}
