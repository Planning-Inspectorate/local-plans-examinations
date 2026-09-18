import type { Request } from 'express';
import type * as authSession from '@planning-inspectorate/core/auth';
import type { ManageService } from '#service';

type LpaOption = { value: string; text: string };

export async function loadCaseOfficerOptions(service: ManageService, req: Request, questions: Record<string, any>) {
	if (service.authDisabled) return;

	const entraClient = service.getEntraClient(req.session as authSession.SessionWithAuth);
	const caseOfficers = entraClient ? await entraClient.listAllGroupMembers(service.entraGroupIds.caseOfficers) : [];

	questions.caseOfficer.options = [
		{ value: '', text: '' },
		...caseOfficers.map((m) => ({ value: m.id, text: m.displayName }))
	];
}

export async function loadInspectorOptions(service: ManageService, req: Request, questions: Record<string, any>) {
	if (service.authDisabled) return;

	const entraClient = service.getEntraClient(req.session as authSession.SessionWithAuth);
	const inspectors = entraClient ? await entraClient.listAllGroupMembers(service.entraGroupIds.inspectors) : [];

	const optionsMap = [{ value: '', text: '' }, ...inspectors.map((m) => ({ value: m.id, text: m.displayName }))];
	questions.examiningInspector1.options = optionsMap;
	questions.examiningInspector2.options = optionsMap;
	questions.examiningInspector3.options = optionsMap;
}

export async function loadLpaOptions(service: ManageService): Promise<LpaOption[]> {
	const { db } = service;

	if (service.authDisabled) {
		return [
			{
				value: 'lpa-1',
				text: 'Local Planning Authority 1'
			},
			{
				value: 'lpa-2',
				text: 'Local Planning Authority 2'
			},
			{
				value: 'lpa-3',
				text: 'Local Planning Authority 3'
			}
		];
	}

	const authorities = await db.authority.findMany({});

	return authorities.map((authority) => ({
		value: authority.pinsCode,
		text: authority.name
	}));
}
