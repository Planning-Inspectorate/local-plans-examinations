import type { Request } from 'express';
import type * as authSession from '@planning-inspectorate/core/auth';
import type { ManageService } from '#service';
import type { PrismaClient } from '@pins/local-plans-database/src/client/client.ts';
import { questions as caseQuestions } from './questions.ts';
import { formatDateToString } from '../../util/date.ts';

export type AssessorGateway = 'gateway-2' | 'gateway-3';

/** An assessor appointed after the first one, stored in the Gateway2Assessor / Gateway3Assessor table */
export type AdditionalAssessorRecord = {
	id: string;
	assessorName: string;
	assessorAppointmentDate: Date;
	createdDate: Date;
};

/**
 * The assessors of a gateway as they are stored: the first assessor is on the Gateway2Info / Gateway3Info row,
 * any assessors added after that are in the Gateway2Assessor / Gateway3Assessor table.
 */
export type AssessorDetails = {
	assessorName?: string | null;
	assessorAppointmentDate?: Date | null;
	additionalAssessors?: AdditionalAssessorRecord[] | null;
};

export type AssessorSaveDetails = {
	assessorName: string | null;
	assessorAppointmentDate: Date | null;
};

export type NewAssessorDetails = {
	assessorName: string;
	assessorAppointmentDate: Date;
};

/** An assessor of a gateway, with the key that identifies it in the remove assessor urls */
export type GatewayAssessor = {
	key: string;
	assessorName: string;
	assessorAppointmentDate: Date | null;
};

/** Key of the assessor stored on the Gateway2Info / Gateway3Info row. The other assessors use their row id. */
export const FIRST_ASSESSOR_KEY = 'first';

const questions = caseQuestions as Record<string, any>;

const ASSESSOR_QUESTION_KEYS: Record<AssessorGateway, string> = {
	'gateway-2': 'gateway2AssessorsName',
	'gateway-3': 'gateway3AssessorsName'
};

type AssessorDb = Pick<PrismaClient, 'gateway2Info' | 'gateway3Info' | 'gateway2Assessor' | 'gateway3Assessor'>;

type GatewayInfoAssessors = {
	id: string;
	assessorName: string | null;
	assessorAppointmentDate: Date | null;
	additionalAssessors: AdditionalAssessorRecord[];
};

type AssessorTables = {
	findInfo: (db: AssessorDb, caseId: string) => Promise<GatewayInfoAssessors | null>;
	saveFirst: (db: AssessorDb, caseId: string, details: AssessorSaveDetails) => Promise<unknown>;
	createAdditional: (db: AssessorDb, gatewayInfoId: string, details: NewAssessorDetails) => Promise<unknown>;
	deleteAdditional: (db: AssessorDb, id: string) => Promise<unknown>;
};

const ASSESSOR_SELECT = {
	id: true,
	assessorName: true,
	assessorAppointmentDate: true,
	additionalAssessors: true
} as const;

/** Each gateway keeps its assessors in its own tables */
const ASSESSOR_TABLES: Record<AssessorGateway, AssessorTables> = {
	'gateway-2': {
		findInfo: async (db, caseId) => db.gateway2Info.findUnique({ where: { caseId }, select: ASSESSOR_SELECT }),
		saveFirst: async (db, caseId, details) =>
			db.gateway2Info.upsert({ where: { caseId }, update: { ...details }, create: { caseId, ...details } }),
		createAdditional: async (db, gatewayInfoId, details) =>
			db.gateway2Assessor.create({ data: { gateway2InfoId: gatewayInfoId, ...details } }),
		deleteAdditional: async (db, id) => db.gateway2Assessor.delete({ where: { id } })
	},
	'gateway-3': {
		findInfo: async (db, caseId) => db.gateway3Info.findUnique({ where: { caseId }, select: ASSESSOR_SELECT }),
		saveFirst: async (db, caseId, details) =>
			db.gateway3Info.upsert({ where: { caseId }, update: { ...details }, create: { caseId, ...details } }),
		createAdditional: async (db, gatewayInfoId, details) =>
			db.gateway3Assessor.create({ data: { gateway3InfoId: gatewayInfoId, ...details } }),
		deleteAdditional: async (db, id) => db.gateway3Assessor.delete({ where: { id } })
	}
};

/**
 * List the assessors of a gateway in the order they are numbered on the gateway tab:
 * the first assessor, then the additional assessors in the order they were added.
 */
export function toGatewayAssessors(details: AssessorDetails | null | undefined): GatewayAssessor[] {
	const assessors: GatewayAssessor[] = [];
	if (details?.assessorName) {
		assessors.push({
			key: FIRST_ASSESSOR_KEY,
			assessorName: details.assessorName,
			assessorAppointmentDate: details.assessorAppointmentDate ?? null
		});
	}
	const additionalAssessors = [...(details?.additionalAssessors ?? [])].sort(
		(a, b) => new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime() || a.id.localeCompare(b.id)
	);
	for (const assessor of additionalAssessors) {
		assessors.push({
			key: assessor.id,
			assessorName: assessor.assessorName,
			assessorAppointmentDate: assessor.assessorAppointmentDate
		});
	}
	return assessors;
}

/**
 * Get the assessors of a gateway for a case
 */
export async function getGatewayAssessors(
	db: AssessorDb,
	caseId: string,
	gateway: AssessorGateway
): Promise<GatewayAssessor[]> {
	return toGatewayAssessors(await ASSESSOR_TABLES[gateway].findInfo(db, caseId));
}

/**
 * Add an assessor to a gateway. The assessors the gateway already has are kept.
 */
export async function addGatewayAssessor(
	db: AssessorDb,
	caseId: string,
	gateway: AssessorGateway,
	details: NewAssessorDetails
): Promise<void> {
	const tables = ASSESSOR_TABLES[gateway];
	const info = await tables.findInfo(db, caseId);
	if (!info || toGatewayAssessors(info).length === 0) {
		await tables.saveFirst(db, caseId, details);
		return;
	}
	await tables.createAdditional(db, info.id, details);
}

/**
 * Remove one assessor from a gateway, leaving the others in place.
 * Returns the assessor that was removed, or null if the gateway has no assessor with the given key.
 */
export async function removeGatewayAssessor(
	db: AssessorDb & Pick<PrismaClient, '$transaction'>,
	caseId: string,
	gateway: AssessorGateway,
	key: string
): Promise<GatewayAssessor | null> {
	const tables = ASSESSOR_TABLES[gateway];
	const assessors = toGatewayAssessors(await tables.findInfo(db, caseId));
	const assessor = assessors.find((item) => item.key === key);
	if (!assessor) {
		return null;
	}
	if (assessor.key !== FIRST_ASSESSOR_KEY) {
		await tables.deleteAdditional(db, assessor.key);
		return assessor;
	}
	const nextAssessor = assessors.find((item) => item.key !== FIRST_ASSESSOR_KEY);
	if (!nextAssessor) {
		await tables.saveFirst(db, caseId, { assessorName: null, assessorAppointmentDate: null });
		return assessor;
	}
	// the next assessor takes the place of the first assessor, so the remaining assessors keep their order
	await db.$transaction(async (transaction) => {
		await tables.saveFirst(transaction, caseId, {
			assessorName: nextAssessor.assessorName,
			assessorAppointmentDate: nextAssessor.assessorAppointmentDate
		});
		await tables.deleteAdditional(transaction, nextAssessor.key);
	});
	return assessor;
}

export const ASSESSOR_SECTION = 'assessors';

/**
 * Build the urls for the add / remove assessor pages of a gateway
 */
export function getAssessorUrls(reference: string, gateway: AssessorGateway) {
	const tabUrl = `/case/${encodeURIComponent(reference)}/${gateway}`;
	const baseUrl = `${tabUrl}/assessor`;
	return {
		tabUrl,
		baseUrl,
		questionUrl: `${baseUrl}/${ASSESSOR_SECTION}/${questions[ASSESSOR_QUESTION_KEYS[gateway]].url}`,
		checkUrl: `${baseUrl}/check`,
		removeUrl: `${baseUrl}/remove`
	};
}

/**
 * Build the url of the "Remove assessor?" page for one assessor of a gateway
 */
export function getAssessorRemoveUrl(reference: string, gateway: AssessorGateway, key: string) {
	return `${getAssessorUrls(reference, gateway).removeUrl}/${encodeURIComponent(key)}`;
}

const SESSION_KEY = 'assessorDrafts';

function draftKey(reference: string, gateway: AssessorGateway) {
	return `${reference}:${gateway}`;
}

function getDrafts(req: Request): Record<string, string> | undefined {
	const session = req.session as unknown as Record<string, any> | undefined;
	return session?.[SESSION_KEY];
}

export function getAssessorDraft(req: Request, reference: string, gateway: AssessorGateway): string | undefined {
	const draft = getDrafts(req)?.[draftKey(reference, gateway)];
	return typeof draft === 'string' && draft.trim() !== '' ? draft : undefined;
}

export function setAssessorDraft(req: Request, reference: string, gateway: AssessorGateway, assessorName: string) {
	const session = req.session as unknown as Record<string, any>;
	session[SESSION_KEY] = { ...session[SESSION_KEY], [draftKey(reference, gateway)]: assessorName };
}

export function clearAssessorDraft(req: Request, reference: string, gateway: AssessorGateway) {
	const drafts = getDrafts(req);
	if (drafts) {
		delete drafts[draftKey(reference, gateway)];
	}
}

/**
 * The assessor is stored as the value of the selected option (the Entra user id when auth is enabled).
 * Resolve it to the name that should be shown to the user, falling back to the stored value.
 */
export async function resolveAssessorDisplayName(
	service: ManageService,
	req: Request,
	gateway: AssessorGateway,
	assessor: string
): Promise<string> {
	const options: { value: string; text: string }[] = questions[ASSESSOR_QUESTION_KEYS[gateway]].options ?? [];
	const option = options.find((item) => item.value === assessor);
	if (option?.text) {
		return option.text;
	}
	if (!service.authDisabled) {
		try {
			const entraClient = service.getEntraClient(req.session as authSession.SessionWithAuth);
			const displayName = entraClient ? await entraClient.getUserDisplayName(assessor) : undefined;
			if (displayName) {
				return displayName;
			}
		} catch {
			/* empty */
		}
	}
	return assessor;
}

/**
 * Build the locals that case-overview.njk needs to render the "Assessors" block on a gateway tab
 */
export async function buildAssessorTabLocals(
	service: ManageService,
	req: Request,
	reference: string,
	gateway: AssessorGateway,
	details: AssessorDetails | null | undefined
) {
	const { questionUrl } = getAssessorUrls(reference, gateway);
	const assessors = [];
	for (const [index, assessor] of toGatewayAssessors(details).entries()) {
		assessors.push({
			number: index + 1,
			name: await resolveAssessorDisplayName(service, req, gateway, assessor.assessorName),
			appointedDate: assessor.assessorAppointmentDate
				? formatDateToString(new Date(assessor.assessorAppointmentDate))
				: '',
			removeLink: getAssessorRemoveUrl(reference, gateway, assessor.key)
		});
	}
	return { assessorLink: questionUrl, assessors };
}

export function escapeHtml(value: string): string {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}
