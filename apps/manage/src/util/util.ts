import type { ManageService } from '#service';
import type { AuthSession } from '#util/cached-entra-client.ts';
import { EXAMINING_INSPECTOR_FIELDS } from '../app/classes/case-field-mappings.ts';
import type { Request } from 'express';
import type { PrismaClient } from '@pins/local-plans-database/src/client/client.ts';
import {
	EXAMINATION_OTHER_DOCUMENT_SETS,
	EXAMINATION_REQUIRED_DOCUMENT_SETS
} from '@pins/local-plans-database/src/seed/static-data/ids/document-set.ts';
import { EXAMINATION_STATUS_ID } from '@pins/local-plans-database/src/seed/static-data/ids/index.ts';

/**
 * Immutably sort the given list submission details, with null completionDate values at the end
 * @returns The sorted dates, with undefined/null completionDate values at the end
 * @param submissions
 */
export function sortGateway3Submissions(
	submissions: {
		id: string;
		decision: string | null;
		completionDate: Date | null;
		submittedDate?: Date | null;
		gateway3InfoId: string | null;
	}[]
) {
	return submissions.toSorted((a, b) => {
		if (!(a.completionDate || b.completionDate)) return 0;
		if (!a.completionDate) return 1;
		if (!b.completionDate) return -1;
		return a.completionDate.getTime() - b.completionDate.getTime();
	});
}

export type examinationStatusWithPause = {
	id: string | null;
	submissionForExaminationDate: Date | null;
	examiningInspector1: string | null;
	examiningInspector2: string | null;
	examiningInspector3: string | null;
	QADate: Date | null;
	qaInspector1: string | null;
	qaInspector2: string | null;
	qaInspector3: string | null;
	panelResponseToInspectorDate: Date | null;
	finalReportIssueDate: Date | null;
	adoptionDate: Date | null;
	planPauseHistory: { planPauseDate: Date | null; planPauseEndDate: Date | null }[];
	shouldPause?: boolean;
};
export const getExaminationStages = async (service: ManageService, caseId: string) => {
	const examinationStatus: examinationStatusWithPause | null = await service.db.examinationInfo.findFirst({
		where: { caseId },
		select: {
			id: true,
			submissionForExaminationDate: true,
			examiningInspector1: true,
			examiningInspector2: true,
			examiningInspector3: true,
			QADate: true,
			qaInspector1: true,
			qaInspector2: true,
			qaInspector3: true,
			panelResponseToInspectorDate: true,
			finalReportIssueDate: true,
			adoptionDate: true,
			planPauseHistory: {
				orderBy: { createdAt: 'desc' },
				take: 1,
				select: { planPauseDate: true, planPauseEndDate: true }
			}
		}
	});

	if (examinationStatus !== null) {
		const latestStart = examinationStatus.planPauseHistory[0]?.planPauseDate;
		const end = examinationStatus.planPauseHistory[0]?.planPauseEndDate;
		examinationStatus.shouldPause = !!latestStart && (!end || latestStart > end);

		return examinationStatus;
	}
};

// The LPA has not submitted for examination while the front office journey is in one of these states
export const NOT_SUBMITTED_STATUSES = new Set<string>([
	EXAMINATION_STATUS_ID.CANNOT_START_YET,
	EXAMINATION_STATUS_ID.READY_TO_START,
	EXAMINATION_STATUS_ID.IN_PROGRESS
]);

export const REQUIRED_FIELDS = Object.keys(EXAMINATION_REQUIRED_DOCUMENT_SETS);
export const OTHER_FIELDS = Object.keys(EXAMINATION_OTHER_DOCUMENT_SETS);

/**
 * Immutably sort the given list of objects by a date column. details, with null createdDate values at the end
 * @param workshops The objects to filter and sort
 * @param hearings The objects to filter and sort
 * @returns The sorted objects
 */
export function sortByDateColumn(objects: { [key: string]: any }[], columnName: string) {
	return objects.toSorted((a, b) => {
		if (!(a[columnName] || b[columnName])) return 0;
		if (!a[columnName]) return 1;
		if (!b[columnName]) return -1;
		const aDate = typeof a[columnName] === 'string' ? new Date(a[columnName]) : a[columnName];
		const bDate = typeof b[columnName] === 'string' ? new Date(b[columnName]) : b[columnName];
		return aDate.getTime() - bDate.getTime();
	});
}

/**
 * Look up the emails of the examining inspectors of a case in Entra.
 * @param onlyInspectorIds When given, only these inspectors are included (they must still be one of the case's examining inspectors)
 */
export async function getExaminingInspectorContacts(
	service: ManageService,
	req: Request & { session: AuthSession },
	examinationInfo: Record<string, unknown> | null,
	onlyInspectorIds?: string[]
): Promise<string[]> {
	const entraClient = service.getEntraClient(req.session);
	if (!entraClient || !examinationInfo) return [];

	const inspectorIds = EXAMINING_INSPECTOR_FIELDS.map((field) => examinationInfo[field]).filter(
		(id): id is string =>
			typeof id === 'string' && id.length > 0 && (!onlyInspectorIds || onlyInspectorIds.includes(id))
	);

	const emails = await Promise.all(
		inspectorIds.map(async (id) => {
			try {
				return (await entraClient.getUserEmailFromId(id)).trim();
			} catch (error) {
				service.logger.warn({ error, inspectorId: id }, 'Could not look up examining inspector email in Entra');
				return '';
			}
		})
	);

	return emails.filter((email) => email.length > 0);
}

export type ExaminationDocumentFile = {
	guid: string;
	fileName: string;
};

/**
 * Loads the documents the LPA uploaded in the examination submission (front office)
 * and groups them by the field they were uploaded against, so they can be listed and downloaded.
 */
export const compileExaminationDocumentFiles = async (
	db: PrismaClient,
	caseId: string
): Promise<Record<string, ExaminationDocumentFile[]>> => {
	const fieldBySetId = new Map(
		Object.entries({ ...EXAMINATION_REQUIRED_DOCUMENT_SETS, ...EXAMINATION_OTHER_DOCUMENT_SETS }).map(
			([field, setId]) => [setId, field]
		)
	);
	const documents = await db.document.findMany({
		where: {
			caseId,
			isDeleted: false,
			isTemp: false,
			documentSetId: { in: [...fieldBySetId.keys()] }
		},
		include: { latestDocumentVersion: true },
		orderBy: { createdAt: 'asc' }
	});

	const documentFiles: Record<string, ExaminationDocumentFile[]> = {};
	for (const document of documents) {
		const field = fieldBySetId.get(document.documentSetId);
		if (!field) continue;
		(documentFiles[field] ??= []).push({
			guid: document.guid,
			fileName: document.latestDocumentVersion?.originalFilename ?? document.name
		});
	}
	return documentFiles;
};
