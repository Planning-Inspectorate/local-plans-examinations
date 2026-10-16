import type { Request } from 'express';
import type * as authSession from '@planning-inspectorate/core/auth';
import type { ManageService } from '#service';
import { EXAMINING_INSPECTOR_FIELDS } from '../classes/case-field-mappings.ts';

type LpaOption = { value: string; text: string };

/**
 * Loads the case officer options into the provided questions object.
 * @param service The manage service instance.
 * @param req The express request object.
 * @param questions The questions object to populate with case officer options.
 */
export async function loadCaseOfficerOptions(service: ManageService, req: Request, questions: Record<string, any>) {
	if (service.authDisabled) return;

	const entraClient = service.getEntraClient(req.session as authSession.SessionWithAuth);
	const caseOfficers = entraClient ? await entraClient.listAllGroupMembers(service.entraGroupIds.caseOfficers) : [];

	questions.caseOfficer.options = [
		{ value: '', text: '' },
		...caseOfficers.map((m) => ({ value: m.id, text: m.displayName }))
	];
}

/**
 * Loads the inspector options into the provided questions object.
 * @param service The manage service instance.
 * @param req The express request object.
 * @param questions The questions object to populate with inspector options.
 */
export async function loadInspectorOptions(service: ManageService, req: Request, questions: Record<string, any>) {
	if (service.authDisabled) return;

	const entraClient = service.getEntraClient(req.session as authSession.SessionWithAuth);
	const inspectors = entraClient ? await entraClient.listAllGroupMembers(service.entraGroupIds.inspectors) : [];

	const optionsMap = [{ value: '', text: '' }, ...inspectors.map((m) => ({ value: m.id, text: m.displayName }))];
	for (const field of EXAMINING_INSPECTOR_FIELDS) {
		questions[field].options = optionsMap;
	}
}

/**
 * Retrieves the list of case officer options to be put directly into a questions options array.
 * @param service The manage service instance.
 * @param session The authentication session.
 * @returns A promise that resolves to an array of case officer options.
 */
export async function retrieveCaseOfficers(
	service: ManageService,
	session: authSession.SessionWithAuth
): Promise<{ value: string; text: string }[]> {
	if (service.authDisabled) {
		return retrieveDefaultCaseOfficers();
	}

	const entraClient = service.getEntraClient(session);
	const caseOfficers = entraClient ? await entraClient.listAllGroupMembers(service.entraGroupIds.caseOfficers) : [];
	return [{ value: '', text: '' }, ...caseOfficers.map((m) => ({ value: m.id, text: m.displayName }))];
}

export function retrieveDefaultCaseOfficers() {
	return [
		{ value: '', text: '' },
		{ value: 'officer-1', text: 'Case Officer 1' },
		{ value: 'officer-2', text: 'Case Officer 2' },
		{ value: 'officer-3', text: 'Case Officer 3' }
	];
}

function retrieveDefaultLpaOptions(): LpaOption[] {
	return [
		{ value: '', text: '' },
		{ value: 'lpa-1', text: 'Local Planning Authority 1' },
		{ value: 'lpa-2', text: 'Local Planning Authority 2' },
		{ value: 'lpa-3', text: 'Local Planning Authority 3' },
		{ value: 'lpa-4', text: 'Local Planning Authority 4' }
	];
}

/**
 * Loads Local Planning Authority (LPA) options either from a database or a predefined list. To be put directly into a questions options array.
 * @param {ManageService} service - The service instance containing the database and other configurations.
 * @param addEmptyValue Whether to include an empty value option.
 * @return {Promise<LpaOption[]>} A promise that resolves to an array of LPA options. Each option includes a value and text property.
 */
export async function loadLpaOptions(service: ManageService, addEmptyValue: boolean): Promise<LpaOption[]> {
	const { db } = service;

	if (service.authDisabled) {
		return retrieveDefaultLpaOptions();
	}

	const authorities = await db.authority.findMany({
		orderBy: { name: 'asc' }
	});

	if (authorities.length > 0) {
		if (addEmptyValue) {
			return [
				{ value: '', text: '' },
				...authorities.map((authority) => ({
					value: authority.pinsCode,
					text: authority.name
				}))
			];
		}
		return authorities.map((authority) => ({
			value: authority.pinsCode,
			text: authority.name
		}));
	}

	return retrieveDefaultLpaOptions();
}
