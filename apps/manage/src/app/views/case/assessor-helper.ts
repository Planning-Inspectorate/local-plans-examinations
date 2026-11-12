import type { Request } from 'express';
import type * as authSession from '@planning-inspectorate/core/auth';
import type { ManageService } from '#service';
import type { PrismaClient } from '@pins/local-plans-database/src/client/client.ts';
import { questions as caseQuestions } from './questions.ts';
import { formatDateToString } from '../../util/date.ts';

export type AssessorGateway = 'gateway-2' | 'gateway-3';

export type AssessorDetails = {
	assessorName?: string | null;
	assessorAppointmentDate?: Date | null;
};

export type AssessorSaveDetails = {
	assessorName: string | null;
	assessorAppointmentDate: Date | null;
};

const questions = caseQuestions as Record<string, any>;

const ASSESSOR_QUESTION_KEYS: Record<AssessorGateway, string> = {
	'gateway-2': 'gateway2AssessorsName',
	'gateway-3': 'gateway3AssessorsName'
};

/**
 * Get the Gateway 2 assessor of a case from the Gateway2Info table
 */
export function getGateway2Assessor(db: Pick<PrismaClient, 'gateway2Info'>, caseId: string) {
	return db.gateway2Info.findUnique({
		where: { caseId },
		select: { assessorName: true, assessorAppointmentDate: true }
	});
}

/**
 * Save the Gateway 2 assessor of a case to the Gateway2Info table
 */
export function saveGateway2Assessor(
	db: Pick<PrismaClient, 'gateway2Info'>,
	caseId: string,
	details: AssessorSaveDetails
) {
	return db.gateway2Info.upsert({
		where: { caseId },
		update: { assessorName: details.assessorName, assessorAppointmentDate: details.assessorAppointmentDate },
		create: { caseId, assessorName: details.assessorName, assessorAppointmentDate: details.assessorAppointmentDate }
	});
}

/**
 * Get the Gateway 3 assessor of a case from the Gateway3Info table
 */
export function getGateway3Assessor(db: Pick<PrismaClient, 'gateway3Info'>, caseId: string) {
	return db.gateway3Info.findUnique({
		where: { caseId },
		select: { assessorName: true, assessorAppointmentDate: true }
	});
}

/**
 * Save the Gateway 3 assessor of a case to the Gateway3Info table
 */
export function saveGateway3Assessor(
	db: Pick<PrismaClient, 'gateway3Info'>,
	caseId: string,
	details: AssessorSaveDetails
) {
	return db.gateway3Info.upsert({
		where: { caseId },
		update: { assessorName: details.assessorName, assessorAppointmentDate: details.assessorAppointmentDate },
		create: { caseId, assessorName: details.assessorName, assessorAppointmentDate: details.assessorAppointmentDate }
	});
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
	const { questionUrl, removeUrl } = getAssessorUrls(reference, gateway);
	const assessors = [];
	if (details?.assessorName) {
		assessors.push({
			number: 1,
			name: await resolveAssessorDisplayName(service, req, gateway, details.assessorName),
			appointedDate: details.assessorAppointmentDate
				? formatDateToString(new Date(details.assessorAppointmentDate))
				: '',
			removeLink: removeUrl
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
