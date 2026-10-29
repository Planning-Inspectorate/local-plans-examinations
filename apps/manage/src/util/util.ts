import type { ManageService } from '#service';

/**
 * Immutably sort the given list submission details, with null completionDate values at the end
 * @returns The sorted dates, with undefined/null completionDate values at the end
 * @param submissions
 */
export function sortGateway3Submissions(
	submissions: { id: string; decision: string | null; completionDate: Date | null; gateway3InfoId: string | null }[]
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
