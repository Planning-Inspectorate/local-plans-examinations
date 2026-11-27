import type { Request } from 'express';
import type { PrismaClient } from '@pins/local-plans-database/src/client/client.ts';
import { questions } from './questions.ts';
import { COMMON_CONSTS } from '../../classes/common-consts.ts';
import { formatDateToString } from '../../util/date.ts';

const questionsMap = questions as Record<string, any>;

/** A QA inspector saved on the examination of a case */
export type QaInspectorRecord = {
	id: string;
	name: string;
	appointmentDate: Date;
	createdDate: Date;
};

/** Key of the session object that holds QA inspector drafts */
const SESSION_KEY = 'qaInspectorDrafts';

function draftKey(reference: string) {
	return reference;
}

type QaInspectorDraft = {
	name: string;
	appointedDate?: string;
	/** which question was last saved, so the confirm page's Back link can go to the previous page */
	lastEdited?: 'name' | 'date';
};

function getDrafts(req: Request): Record<string, QaInspectorDraft> | undefined {
	const session = req.session as unknown as Record<string, any> | undefined;
	return session?.[SESSION_KEY];
}

export function getQaInspectorDraft(req: Request, reference: string): QaInspectorDraft | undefined {
	return getDrafts(req)?.[draftKey(reference)];
}

export function setQaInspectorDraft(req: Request, reference: string, draft: QaInspectorDraft) {
	const session = req.session as unknown as Record<string, any>;
	session[SESSION_KEY] = { ...session[SESSION_KEY], [draftKey(reference)]: draft };
}

export function clearQaInspectorDraft(req: Request, reference: string) {
	const drafts = getDrafts(req);
	if (drafts) {
		delete drafts[draftKey(reference)];
	}
}

/**
 * The answers the QA inspector journey questions read from, built from the session draft
 */
export function qaInspectorDraftAnswers(draft: QaInspectorDraft | undefined): Record<string, unknown> {
	if (!draft) {
		return {};
	}
	return {
		qaInspectorName: draft.name ?? '',
		qaInspectorAppointmentDate: draft.appointedDate
	};
}

/** Build the urls for the add / remove QA inspector pages of a case's examination */
export function getQaInspectorUrls(reference: string) {
	const tabUrl = `/case/${encodeURIComponent(reference)}/examination`;
	const baseUrl = `${tabUrl}/${COMMON_CONSTS.QA_INSPECTOR_BASE_PATH}`;
	return {
		tabUrl,
		baseUrl,
		questionUrl: `${baseUrl}/${COMMON_CONSTS.QA_INSPECTOR_SECTION}/${questionsMap.qaInspectorName.url}`,
		dateUrl: `${baseUrl}/${COMMON_CONSTS.QA_INSPECTOR_SECTION}/${questionsMap.qaInspectorAppointmentDate.url}`,
		checkUrl: `${baseUrl}/check`,
		removeUrl: `${baseUrl}/remove`
	};
}

/** The QA inspectors of a case's examination, in the order they are numbered on the tab */
export async function getQaInspectors(db: PrismaClient, caseId: string): Promise<QaInspectorRecord[]> {
	const examinationInfo = await db.examinationInfo.findUnique({
		where: { caseId },
		select: { id: true, qaInspectors: true }
	});
	if (!examinationInfo) {
		return [];
	}
	return [...(examinationInfo.qaInspectors ?? [])].sort(
		(a, b) => new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime() || a.id.localeCompare(b.id)
	);
}

/**
 * Add a QA inspector to a case's examination, creating the examination row if the case does not have one yet
 */
export async function addQaInspector(
	db: PrismaClient,
	caseId: string,
	details: { name: string; appointmentDate: Date }
): Promise<void> {
	const examinationInfo = await db.examinationInfo.upsert({
		where: { caseId },
		update: {},
		create: { caseId }
	});
	await db.qaInspector.create({
		data: { examinationInfoId: examinationInfo.id, name: details.name, appointmentDate: details.appointmentDate }
	});
}

/**
 * Remove one QA inspector from a case's examination.
 * Returns the inspector that was removed, or null if there is no inspector with the given id.
 */
export async function removeQaInspector(
	db: PrismaClient,
	caseId: string,
	inspectorId: string
): Promise<QaInspectorRecord | null> {
	const examinationInfo = await db.examinationInfo.findUnique({
		where: { caseId },
		select: { id: true }
	});
	if (!examinationInfo) {
		return null;
	}
	const inspector = await db.qaInspector.findFirst({
		where: { id: inspectorId, examinationInfoId: examinationInfo.id }
	});
	if (!inspector) {
		return null;
	}
	await db.qaInspector.delete({ where: { id: inspector.id } });
	return inspector;
}

/**
 * Build the locals that case-overview.njk needs to render the QA inspector block on the examination tab
 */
export async function buildQaInspectorTabLocals(db: PrismaClient, reference: string) {
	const { questionUrl, removeUrl } = getQaInspectorUrls(reference);
	const inspectors = await getQaInspectors(db, (await resolveCaseId(db, reference)) ?? '');
	const qaInspectors = inspectors.map((inspector, index) => ({
		number: index + 1,
		name: inspector.name,
		appointedDate: formatDateToString(new Date(inspector.appointmentDate)),
		removeLink: `${removeUrl}/${encodeURIComponent(inspector.id)}`
	}));
	return { qaInspectorLink: questionUrl, qaInspectors };
}

async function resolveCaseId(db: PrismaClient, reference: string): Promise<string | undefined> {
	const caseRecord = await db.case.findUnique({ where: { reference }, select: { id: true } });
	return caseRecord?.id;
}
